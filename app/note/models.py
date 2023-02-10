import string
import random

from django.db import models
from django.template.defaultfilters import slugify

from django_resized import ResizedImageField


# Create your models here.


class LocalMessageList(models.Model):
    name = models.CharField(max_length=255, default="", unique=True)
    slug = models.SlugField(default="n")

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super(LocalMessageList, self).save(*args, **kwargs)


def get_upload_path(instance, filename):
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    return f'images/{instance.id}-{random_str}-{filename}'


class LocalMessage(models.Model):
    text = models.TextField(blank=True)
    list = models.ForeignKey(LocalMessageList, on_delete=models.CASCADE, default=1)
    pinned = models.BooleanField(default=False)
    image = ResizedImageField(upload_to=get_upload_path, size=[1024, 1024], blank=True, null=True)
    archived = models.BooleanField(default=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)