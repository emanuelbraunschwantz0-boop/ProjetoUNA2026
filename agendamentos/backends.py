from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    """Permite entrar com o e-mail no campo de usuário.

    O cadastro guarda o e-mail em `username` e em `email`, mas o login por
    e-mail continua funcionando mesmo se alguém mudar o username no admin.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or password is None:
            return None
        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=username.strip())
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
