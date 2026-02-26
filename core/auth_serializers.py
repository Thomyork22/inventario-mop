from rest_framework import serializers
from django.contrib.auth.models import User


class MeSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_superuser", "is_staff", "groups"]

    def get_groups(self, obj):
        return [g.name for g in obj.groups.all()]