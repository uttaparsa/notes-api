from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from note.models import Workspace, LocalMessageList


class Command(BaseCommand):
    help = 'Create default workspaces for existing users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        for user in User.objects.all():
            self.stdout.write(f'Processing user: {user.username}')
            
            # Check if user already has a default workspace
            existing_default = Workspace.objects.filter(user=user, is_default=True).first()
            if existing_default:
                self.stdout.write(f'  User already has default workspace: {existing_default.name}')
                continue
            
            # Get all categories for this user
            categories = LocalMessageList.objects.filter(user=user)
            
            if not categories.exists():
                self.stdout.write(f'  No categories found for user {user.username}')
                continue
            
            # Create default workspace
            default_workspace_name = f"{user.username}'s Workspace"
            if dry_run:
                self.stdout.write(f'  Would create default workspace: {default_workspace_name}')
                self.stdout.write(f'  Would assign {categories.count()} categories')
            else:
                workspace = Workspace.objects.create(
                    name=default_workspace_name,
                    description='Default workspace containing all categories',
                    user=user,
                    is_default=True
                )
                
                # Assign all categories to the default workspace
                workspace.categories.set(categories)
                
                # Set a default category (first one or one named 'General', 'Main', etc.)
                default_category = None
                for category in categories:
                    if category.name.lower() in ['general', 'main', 'default', 'notes']:
                        default_category = category
                        break
                
                if not default_category:
                    default_category = categories.first()
                
                workspace.default_category = default_category
                workspace.save()
                
                self.stdout.write(f'  Created default workspace: {workspace.name}')
                self.stdout.write(f'  Assigned {categories.count()} categories')
                self.stdout.write(f'  Set default category: {default_category.name}')
        
        if dry_run:
            self.stdout.write('\nThis was a dry run. No changes were made.')
        else:
            self.stdout.write('\nMigration completed successfully.')