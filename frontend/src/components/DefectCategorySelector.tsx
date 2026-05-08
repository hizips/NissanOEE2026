import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';

interface DefectCategorySelectorProps {
  value: {
    category: string;
    subcategory: string;
    comment?: string;
  } | null;
  onChange: (value: {
    category: string;
    subcategory: string;
    comment?: string;
  } | null) => void;
}

const DEFECT_CATEGORIES = {
  Casting: [
    'Crack',
    'Porosity',
    'Pan seal FIPG Face',
    'Cover seal FIPG Face',
    'UVW Cover gasket face',
    'LV Connector Seal',
    'UVW Connector face',
    'PN Connector face',
    'A/C Connector seal face',
    'Motor Mounting Bosses',
    'Lower Bolt Flange',
    'Upper Bolt Flange',
    'Upper Side Thread Hole',
    'Lower Side Thread Hole',
    'PM Face',
    'General',
    'Coldshut',
    'Gate break',
    'Inclusion',
    'Chipping',
    'NCU',
    'Laser Mark Defects',
    'Others',
  ],
  Machining: [
    'Dimensional',
    'Handling',
    'Misload',
    'Tool breakage',
    'Chatter',
    'Double Machine',
    'Swarf Damage',
    'Others',
  ],
};

export function DefectCategorySelector({ value, onChange }: DefectCategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(value?.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(value?.subcategory || '');
  const [comment, setComment] = useState<string>(value?.comment || '');

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    onChange(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    onChange({
      category: selectedCategory,
      subcategory,
      comment: comment || undefined,
    });
  };

  const handleCommentChange = (newComment: string) => {
    setComment(newComment);
    if (selectedCategory && selectedSubcategory) {
      onChange({
        category: selectedCategory,
        subcategory: selectedSubcategory,
        comment: newComment || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <Card className="border-2 border-orange-300">
        <CardHeader className="bg-orange-50">
          <CardTitle className="text-xl">1. Select Defect Category</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(DEFECT_CATEGORIES).map((category) => (
              <Button
                key={category}
                onClick={() => handleCategoryClick(category)}
                size="lg"
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={`h-24 text-2xl font-bold ${
                  selectedCategory === category
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'border-2 border-orange-300 hover:bg-orange-50'
                }`}
              >
                {category}
                {selectedCategory === category && (
                  <Badge className="ml-3 bg-orange-900">Selected</Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subcategory Selection */}
      {selectedCategory && (
        <Card className="border-2 border-red-300 animate-in fade-in slide-in-from-top-4">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl">
              2. Select {selectedCategory} Defect Type
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-80">
              <div className="grid grid-cols-2 gap-3 pr-4">
                {DEFECT_CATEGORIES[selectedCategory as keyof typeof DEFECT_CATEGORIES].map(
                  (subcategory) => (
                    <Button
                      key={subcategory}
                      onClick={() => handleSubcategoryClick(subcategory)}
                      size="lg"
                      variant={selectedSubcategory === subcategory ? 'default' : 'outline'}
                      className={`h-20 text-lg font-semibold ${
                        selectedSubcategory === subcategory
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'border-2 border-red-200 hover:bg-red-50 text-left justify-start'
                      }`}
                    >
                      {subcategory}
                      {selectedSubcategory === subcategory && (
                        <Badge className="ml-auto bg-red-900">✓</Badge>
                      )}
                    </Button>
                  )
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Optional Comment */}
      {selectedCategory && selectedSubcategory && (
        <Card className="border-2 border-blue-300 animate-in fade-in slide-in-from-top-4">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">3. Optional Comment</CardTitle>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                Optional
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Label htmlFor="defect-comment" className="text-base">
                Additional details or notes about this defect
              </Label>
              <Textarea
                id="defect-comment"
                value={comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Enter any additional information (optional)..."
                className="min-h-24 text-lg"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {selectedCategory && selectedSubcategory && (
        <Card className="border-2 border-green-300 bg-green-50 animate-in fade-in slide-in-from-top-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-green-700" />
              <div>
                <div className="font-semibold text-green-900 mb-1">Selected Defect Reason:</div>
                <div className="text-lg font-bold text-green-800">
                  {selectedCategory} → {selectedSubcategory}
                </div>
                {comment && (
                  <div className="text-sm text-green-700 mt-2">
                    Comment: "{comment}"
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
