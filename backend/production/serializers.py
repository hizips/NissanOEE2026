from rest_framework import serializers
from .models import Machine, ProductionRecord

class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        fields = '__all__'

class ProductionRecordSerializer(serializers.ModelSerializer):
    # This displays the machine name instead of just an ID
    machine_name = serializers.ReadOnlyField(source='machine.name') 

    class Meta:
        model = ProductionRecord
        fields = '__all__'
