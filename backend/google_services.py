import os
import json
from typing import Optional, Dict, Any, List
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
import logging

logger = logging.getLogger(__name__)

class GoogleWorkspaceService:
    def __init__(self):
        self.client_id = os.environ.get('GOOGLE_CLIENT_ID')
        self.client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
        
        self.scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/chat.spaces',
            'https://www.googleapis.com/auth/chat.messages'
        ]
        
        self.client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri]
            }
        }

    def get_authorization_url(self) -> str:
        """Get Google OAuth authorization URL"""
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            auth_url, _ = flow.authorization_url(prompt='consent')
            return auth_url
        except Exception as e:
            logger.error(f"Error getting authorization URL: {e}")
            raise

    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            return {
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes
            }
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {e}")
            raise

    def refresh_credentials(self, credentials_dict: Dict[str, Any]) -> Credentials:
        """Refresh Google credentials if needed"""
        try:
            credentials = Credentials(
                token=credentials_dict.get("access_token"),
                refresh_token=credentials_dict.get("refresh_token"),
                token_uri=credentials_dict.get("token_uri"),
                client_id=credentials_dict.get("client_id"),
                client_secret=credentials_dict.get("client_secret"),
                scopes=credentials_dict.get("scopes")
            )
            
            if credentials.expired:
                credentials.refresh(Request())
                
            return credentials
        except Exception as e:
            logger.error(f"Error refreshing credentials: {e}")
            raise

    async def send_chat_notification(self, credentials_dict: Dict[str, Any], space_name: str, message: str) -> bool:
        """Send notification to Google Chat"""
        try:
            credentials = self.refresh_credentials(credentials_dict)
            service = build('chat', 'v1', credentials=credentials)
            
            # Create the message
            message_body = {
                'text': message
            }
            
            # Send the message
            result = service.spaces().messages().create(
                parent=space_name,
                body=message_body
            ).execute()
            
            logger.info(f"Chat message sent successfully: {result.get('name')}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending chat notification: {e}")
            return False

    async def create_calendar_event(self, credentials_dict: Dict[str, Any], event_data: Dict[str, Any]) -> Optional[str]:
        """Create a Google Calendar event"""
        try:
            credentials = self.refresh_credentials(credentials_dict)
            service = build('calendar', 'v3', credentials=credentials)
            
            event = service.events().insert(
                calendarId='primary',
                body=event_data
            ).execute()
            
            logger.info(f"Calendar event created: {event.get('id')}")
            return event.get('htmlLink')
            
        except Exception as e:
            logger.error(f"Error creating calendar event: {e}")
            return None

    async def create_drive_folder(self, credentials_dict: Dict[str, Any], folder_name: str, parent_folder_id: Optional[str] = None) -> Optional[str]:
        """Create a folder in Google Drive"""
        try:
            credentials = self.refresh_credentials(credentials_dict)
            service = build('drive', 'v3', credentials=credentials)
            
            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            if parent_folder_id:
                folder_metadata['parents'] = [parent_folder_id]
            
            folder = service.files().create(
                body=folder_metadata,
                fields='id,name,webViewLink'
            ).execute()
            
            logger.info(f"Drive folder created: {folder.get('name')} - {folder.get('id')}")
            return folder.get('webViewLink')
            
        except Exception as e:
            logger.error(f"Error creating drive folder: {e}")
            return None

    async def send_gmail(self, credentials_dict: Dict[str, Any], to_email: str, subject: str, body: str) -> bool:
        """Send an email via Gmail"""
        try:
            credentials = self.refresh_credentials(credentials_dict)
            service = build('gmail', 'v1', credentials=credentials)
            
            import base64
            from email.mime.text import MIMEText
            
            message = MIMEText(body)
            message['to'] = to_email
            message['subject'] = subject
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            result = service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            logger.info(f"Gmail sent successfully: {result.get('id')}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending Gmail: {e}")
            return False

    async def get_or_create_chat_space(self, credentials_dict: Dict[str, Any], space_name: str = "Client Tracker") -> Optional[str]:
        """Get or create a Google Chat space"""
        try:
            credentials = self.refresh_credentials(credentials_dict)
            service = build('chat', 'v1', credentials=credentials)
            
            # List existing spaces
            spaces = service.spaces().list().execute()
            
            # Look for existing space
            for space in spaces.get('spaces', []):
                if space.get('displayName') == space_name:
                    return space.get('name')
            
            # Create new space if not found
            # Note: This might require different permissions/approach
            logger.info(f"Chat space '{space_name}' not found. Manual creation may be required.")
            return None
            
        except Exception as e:
            logger.error(f"Error getting/creating chat space: {e}")
            return None

# Global instance
google_service = GoogleWorkspaceService()