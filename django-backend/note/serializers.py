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
    image = serializers.SerializerMethodField()
    source_links =  LinkSerializer(many=True, read_only=True)

    def get_image(self, obj):
        return obj.image.url if obj.image else None
    
    def get_file(self, obj):
        return obj.file.url if obj.file else None
    
    
    class Meta:
        model = LocalMessage
        fields = '__all__'
        write_only_fields = ['image']



    
class SearchSerializer(serializers.Serializer):
    q = serializers.CharField()
    list_slug = serializers.CharField(required=False)

class MoveMessageSerializer(serializers.Serializer):
    list_id = serializers.IntegerField()


class NoteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalMessageList
        fields = '__all__'
        read_only_fields = ['slug']
