from rest_framework import serializers

from .models import LocalMessage, LocalMessageList


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalMessage
        fields = '__all__'
        write_only_fields = ['image']


class MoveMessageSerializer(serializers.Serializer):
    list_id = serializers.IntegerField()


class NoteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalMessageList
        fields = '__all__'
        read_only_fields = ['slug']
