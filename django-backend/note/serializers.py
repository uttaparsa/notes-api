from rest_framework import serializers

from .models import LocalMessage, LocalMessageList


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalMessage
        fields = '__all__'
        write_only_fields = ['image']


from rest_framework import serializers

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
