def perfil(request):
    """Disponibiliza em todos os templates:
    `perfil_tipo` ('cliente' | 'profissional' | None) e `eh_admin` (administração do salão)."""
    from .views import eh_admin, perfil_do_usuario

    if request.user.is_authenticated:
        return {"perfil_tipo": perfil_do_usuario(request.user)[0], "eh_admin": eh_admin(request.user)}
    return {"perfil_tipo": None, "eh_admin": False}
