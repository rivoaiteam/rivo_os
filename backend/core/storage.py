"""
Supabase Storage Service for document uploads
"""
import os
import uuid
from django.conf import settings
from supabase import create_client, Client


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
    return create_client(url, key)


class SupabaseStorage:
    """Service for handling file uploads to Supabase Storage"""

    BUCKET_NAME = "documents"

    def __init__(self):
        self.client = get_supabase_client()

    def ensure_bucket_exists(self):
        """Create the documents bucket if it doesn't exist"""
        try:
            # Try to get bucket info
            self.client.storage.get_bucket(self.BUCKET_NAME)
        except Exception:
            # Create bucket if it doesn't exist
            self.client.storage.create_bucket(
                self.BUCKET_NAME,
                options={
                    "public": True,
                    "file_size_limit": 10485760,  # 10MB
                }
            )

    def upload_file(self, file_data: bytes, filename: str, content_type: str, folder: str = "") -> str:
        """
        Upload a file to Supabase Storage

        Args:
            file_data: File content as bytes
            filename: Original filename
            content_type: MIME type of the file
            folder: Optional folder path (e.g., 'clients/123')

        Returns:
            Public URL of the uploaded file
        """
        # Build file path - use folder with UUID to avoid collisions
        unique_folder = f"{folder}/{uuid.uuid4()}" if folder else str(uuid.uuid4())
        file_path = f"{unique_folder}/{filename}"

        # Upload to Supabase
        self.client.storage.from_(self.BUCKET_NAME).upload(
            path=file_path,
            file=file_data,
            file_options={"content-type": content_type}
        )

        # Get public URL
        public_url = self.client.storage.from_(self.BUCKET_NAME).get_public_url(file_path)
        return public_url

    def delete_file(self, file_url: str) -> bool:
        """
        Delete a file from Supabase Storage

        Args:
            file_url: The public URL of the file to delete

        Returns:
            True if deletion was successful
        """
        # Extract file path from URL
        base_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{self.BUCKET_NAME}/"
        if file_url.startswith(base_url):
            file_path = file_url[len(base_url):]
            self.client.storage.from_(self.BUCKET_NAME).remove([file_path])
            return True
        return False

    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> str:
        """
        Get a signed URL for private file access

        Args:
            file_path: Path to the file in storage
            expires_in: Expiration time in seconds (default 1 hour)

        Returns:
            Signed URL for temporary access
        """
        result = self.client.storage.from_(self.BUCKET_NAME).create_signed_url(
            path=file_path,
            expires_in=expires_in
        )
        return result.get("signedURL", "")


# Singleton instance
storage_service = SupabaseStorage()
