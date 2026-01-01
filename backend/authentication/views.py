"""
Authentication views for Rivo OS.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.db import connection

from core.models import User, SystemSettings


class LoginView(APIView):
    """Handle user login with system password."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Single raw SQL query to get user + system password together
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.status,
                       (SELECT system_password FROM system_settings LIMIT 1) as sys_pwd
                FROM users u
                WHERE u.username = %s OR u.email = %s
                LIMIT 1
            """, [username, username])
            row = cursor.fetchone()

        if not row:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user_id, user_username, user_email, first_name, last_name, user_status, system_password = row

        if password != system_password:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if user_status == 'inactive':
            return Response(
                {'error': 'Account is inactive'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get user object for token creation
        user = User.objects.get(id=user_id)

        # Create or get token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user_id,
                'username': user_username,
                'email': user_email,
                'name': f'{first_name} {last_name}'.strip() or user_username,
                'firstName': first_name,
                'lastName': last_name,
                'status': user_status,
            }
        })


class LogoutView(APIView):
    """Handle user logout."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete the user's token
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'})


class MeView(APIView):
    """Get current user info."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': f'{user.first_name} {user.last_name}'.strip() or user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'status': user.status,
        })
