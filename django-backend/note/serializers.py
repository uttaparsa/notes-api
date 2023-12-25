from rest_framework import serializers

from .models import LocalMessage, LocalMessageList


class MessageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        return obj.image.url if obj.image else None
    
    def get_file(self, obj):
        return obj.file.url if obj.file else None
    
    class Meta:
        model = LocalMessage
        fields = '__all__'
        write_only_fields = ['image']



class SeachSerializer(serializers.Serializer):
    q = serializers.CharField()
    list_slug = serializers.CharField(required=False)

class MoveMessageSerializer(serializers.Serializer):
    list_id = serializers.IntegerField()


class NoteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalMessageList
        fields = '__all__'
        read_only_fields = ['slug']
