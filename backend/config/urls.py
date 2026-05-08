from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from production.views import MachineViewSet, ProductionRecordViewSet

router = DefaultRouter()
router.register(r'machines', MachineViewSet)
router.register(r'records', ProductionRecordViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # Your API will be at /api/machines/ etc.
]
