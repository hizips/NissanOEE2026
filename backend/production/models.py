from django.db import models

class Machine(models.Model):
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('idle', 'Idle'),
        ('maintenance', 'Maintenance'),
        ('breakdown', 'Breakdown'),
    ]
    
    name = models.CharField(max_length=100)
    ideal_cycle_time = models.FloatField() # Seconds per unit
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='idle')

    def __str__(self):
        return self.name

class ProductionRecord(models.Model):
    SHIFT_CHOICES = [('morning', 'Morning'), ('afternoon', 'Afternoon'), ('night', 'Night')]
    
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='records')
    date = models.DateField()
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES)
    planned_production_time = models.IntegerField() # In minutes
    downtime = models.IntegerField(default=0)
    total_count = models.IntegerField()
    good_count = models.IntegerField()
    operator_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.machine.name} - {self.date} ({self.shift})"
