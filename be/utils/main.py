import os
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
from dotenv import load_dotenv

load_dotenv()  # Load biến môi trường từ .env

def send_email(subject: str, content_text: str, to_email_str: str, from_email_str: str = "nguyenquoctien2401@gmail.com"):
    # """
    # Gửi email bằng SendGrid.
    
    # Parameters:
    # - subject: Tiêu đề email
    # - content_text: Nội dung văn bản thuần của email
    # - to_email_str: Email người nhận
    # - from_email_str: Email người gửi (phải được xác thực trong SendGrid)
    # """
    print("SENDGRID_API_KEY:", os.getenv('SENDGRID_API_KEY'))
    sg = sendgrid.SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))
    
    from_email = Email(from_email_str)
    to_email = To(to_email_str)
    content = Content("text/plain", content_text)
    mail = Mail(from_email, to_email, subject, content)

    try:
        response = sg.client.mail.send.post(request_body=mail.get())
        print("Status Code:", response.status_code)
        print("Headers:", response.headers)
        if response.status_code == 202:
            print("Email sent successfully.")
        else:
            print(f"Failed to send email. Status: {response.status_code}, Body: {response.body}")
    except Exception as e:
        print("Error sending email:", e)

