from django.core.mail import send_mail
from django.conf import settings

def send_account_created_email(to_email, username, password):
    subject = 'Your Account Has Been Created 🎓'
    message = f"""
    Hi {username}, 👋

    Your account has been successfully created. You can now access the school platform and explore its features.

    👉 Login at: http://localhost:9000/login
    👉 email: {to_email}
    👉 password: {password}
    (make sure to change it after the first login for security reasons)


    Welcome aboard!

    -- bolbeba school
    """
    from_email = settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else 'chairetnouri808@gmail.com'
    send_mail(subject, message, from_email, [to_email], fail_silently=False)
