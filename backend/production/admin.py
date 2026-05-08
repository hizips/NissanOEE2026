from django.contrib import admin
from .models import Machine, ProductionRecord

@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'ideal_cycle_time')
    list_filter = ('status',)

@admin.register(ProductionRecord)
class ProductionRecordAdmin(admin.ModelAdmin):
    list_display = ('machine', 'date', 'shift', 'total_count', 'good_count')
    list_filter = ('date', 'shift', 'machine')
