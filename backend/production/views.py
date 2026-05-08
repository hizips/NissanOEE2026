from django.shortcuts import render

from rest_framework import viewsets
from .models import Machine, ProductionRecord
from .serializers import MachineSerializer, ProductionRecordSerializer

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer

class ProductionRecordViewSet(viewsets.ModelViewSet):
    queryset = ProductionRecord.objects.all().order_by('-timestamp')
    serializer_class = ProductionRecordSerializer

# Create your views here.
