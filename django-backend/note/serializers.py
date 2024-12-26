from rest_framework import serializers

from .models import LocalMessage, LocalMessageList,Link


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
    source_links =  LinkSerializer(many=True, read_only=True)

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
