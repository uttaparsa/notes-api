# from django.db import models
# from django.contrib.auth.models import AbstractUser as DjangoUser, UserManager as DjangoUserManager
# from django.contrib.auth.hashers import make_password
# from django.utils.translation import gettext_lazy as _
#
#
# class UserManager(DjangoUserManager):
#     """
#         we usually do not use objects.create_user and
#         objects.create_superuser methods, but if needed
#         we should override these methods to make them
#         acceptable
#     """
#
#     def create(self, email, password, **extra_fields):
#         """
#         Create and save a user with the given username, email, and password.
#         """
#
#         extra_fields.setdefault('is_staff', False)
#         extra_fields.setdefault('is_superuser', False)
#
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)
#         user.password = make_password(password)
#         user.save(using=self._db)
#         return user
#
#
# def get_upload_path(instance, filename):
#     return f'avatars/{instance.id}/{filename}'
#
#
# class User(DjangoUser):
#
#     username = None
#
#     email = models.EmailField(
#         _('email address'),
#         unique=True,
#     )
#
#     EMAIL_FIELD = 'email'
#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = []
#
#     objects = UserManager()
#
#     def change_password(self, password: str) -> None:
#         new_password_hash = make_password(password)
#         self.password = new_password_hash
#         self.save()
