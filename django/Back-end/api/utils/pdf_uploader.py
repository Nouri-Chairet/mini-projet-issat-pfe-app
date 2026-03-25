from google.cloud import storage
from django.conf import settings
import uuid

def upload_pdf_to_gcs(file):
    """Upload PDF file to Google Cloud Storage and return public URL."""
    client = storage.Client.from_service_account_json(str(settings.GS_CREDENTIALS_FILE_PATH))
    bucket = client.bucket(settings.GS_BUCKET_NAME)

    filename = f"pdfs/{uuid.uuid4()}.pdf"
    blob = bucket.blob(filename)

    blob.upload_from_file(file, content_type='application/pdf')

    return f"https://storage.googleapis.com/{settings.GS_BUCKET_NAME}/{filename}"
