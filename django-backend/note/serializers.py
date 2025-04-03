from rest_framework import serializers

from .models import LocalMessage, LocalMessageList, Link, NoteRevision
import re

class NoteShortViewSerializer(serializers.ModelSerializer):
    def truncate_text(self, value):
        max_length = 25  # Replace this with your desired length
        if len(value) > max_length:
            return value[:max_length] + '...'  # Truncate and add ellipsis
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['text'] = self.truncate_text(representation['text'])
        return representation
    class Meta:
        model = LocalMessage
        fields = ['text','id']

class LinkSerializer(serializers.ModelSerializer):
    source_message =  NoteShortViewSerializer(many=False, read_only=True)
    class Meta:
        model = Link
        fields = '__all__'



class MessageSerializer(serializers.ModelSerializer):
    source_links = LinkSerializer(many=True, read_only=True)


    class Meta:
        model = LocalMessage
        fields = "__all__"



    

class SearchSerializer(serializers.Serializer):
    q = serializers.CharField(required=True, help_text="Search query string")
    list_slug = serializers.CharField(
        required=False, 
        help_text="Single list slug or comma-separated list of slugs (e.g., 'list1,list2,list3')"
    )
    page = serializers.IntegerField(required=False, help_text="Page number for pagination")

    def validate_list_slug(self, value):
        if not value:
            return value
            
        if value.lower() == 'all':
            return value
            
        # Validate that all provided slugs exist
        slug_list = [slug.strip() for slug in value.split(',')]
        existing_slugs = LocalMessageList.objects.filter(
            slug__in=slug_list
        ).values_list('slug', flat=True)
        
        invalid_slugs = set(slug_list) - set(existing_slugs)
        if invalid_slugs:
            raise serializers.ValidationError(
                f"Invalid list slugs: {', '.join(invalid_slugs)}"
            )
            
        return value

class MoveMessageSerializer(serializers.Serializer):
    list_id = serializers.IntegerField()


class NoteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalMessageList
        fields = '__all__'
        read_only_fields = ['slug']


class NoteRevisionSerializer(serializers.ModelSerializer):
    changed_text = serializers.SerializerMethodField()
    
    def get_changed_text(self, obj):
        """
        Extract only the changed portions of the text based on diff.
        Returns a dict with 'before' and 'after' sections around the changes.
        """
        if not obj.diff_text:
            return None
            
        # Parse the diff to find changed sections
        changes = []
        current_change = []
        context_lines = 3  # Number of unchanged lines to show before and after changes
        
        diff_lines = obj.diff_text.splitlines()
        for i, line in enumerate(diff_lines):
            if line.startswith('+ ') or line.startswith('- '):
                # Include previous context lines if this is a new change section
                if not current_change:
                    start_idx = max(0, i - context_lines)
                    current_change.extend(diff_lines[start_idx:i])
                current_change.append(line)
            elif line.startswith('  '):
                if current_change:
                    # Add some context lines after the change
                    current_change.append(line)
                    if len(current_change) > context_lines:
                        changes.append('\n'.join(current_change))
                        current_change = []
        
        # Add any remaining changes
        if current_change:
            changes.append('\n'.join(current_change))
        
        return changes

    class Meta:
        model = NoteRevision
        fields = ['id', 'created_at', 'changed_text', "revision_text"]
        # Note: removed revision_text and diff_text to reduce payload size


class SimilarNoteSerializer(serializers.ModelSerializer):
    similarity_score = serializers.FloatField()
    
    def truncate_text(self, value):
        max_length = 25  # Replace this with your desired length
        if len(value) > max_length:
            return value[:max_length] + '...'  # Truncate and add ellipsis
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Convert distance to a similarity score between 0 and 1
        # Lower distance means higher similarity
        max_distance = 4.0  # This might need adjustment based on your embeddings
        representation['similarity_score'] = max(0, 1 - (representation['similarity_score'] / max_distance))
        representation['text'] = self.truncate_text(representation['text'])
        return representation

    class Meta:
        model = LocalMessage
        fields = ['id', 'text', 'similarity_score']



class SimilarChunkSerializer(serializers.Serializer):
    note_id = serializers.IntegerField()
    chunk_index = serializers.IntegerField()
    chunk_text = serializers.CharField()
    distance = serializers.FloatField()
    similarity_score = serializers.FloatField(read_only=True)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Convert distance to a similarity score between 0 and 1
        # Lower distance means higher similarity
        max_distance = 4.0  # This might need adjustment based on your embeddings
        representation['similarity_score'] = max(0, 1 - (representation['distance'] / max_distance))
        
        # Truncate the chunk text for preview
        representation['chunk_text'] = self.truncate_text(representation['chunk_text'])
        
        return representation
    
    def truncate_text(self, value):
        max_length = 100  # Longer than the note serializer to provide more context
        if len(value) > max_length:
            return value[:max_length] + '...'  # Truncate and add ellipsis
        return value


class SimilarNotesResponseSerializer(serializers.Serializer):
    source_chunk = serializers.SerializerMethodField()
    similar_chunks = SimilarChunkSerializer(many=True)
    
    def get_source_chunk(self, obj):
        source = obj.get('source_chunk', {})
        return {
            'note_id': source.get('note_id'),
            'chunk_index': source.get('chunk_index'),
            'chunk_text': self.truncate_text(source.get('chunk_text', ''))
        }
    
    def truncate_text(self, value):
        max_length = 100
        if len(value) > max_length:
            return value[:max_length] + '...'
        return value