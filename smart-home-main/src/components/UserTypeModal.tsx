import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Home } from "lucide-react";

interface UserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'seeker' | 'lister') => void;
}

export const UserTypeModal = ({ isOpen, onClose, onSelectType }: UserTypeModalProps) => {
  const handleSelection = (type: 'seeker' | 'lister') => {
    onSelectType(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-2">
            What brings you to Smart Roomie?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button
            onClick={() => handleSelection('seeker')}
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center space-y-3 hover:bg-primary-light hover:border-primary transition-all duration-300"
          >
            <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">I'm looking for a room</div>
              <div className="text-sm text-muted-foreground">Seeker</div>
            </div>
          </Button>

          <Button
            onClick={() => handleSelection('lister')}
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center space-y-3 hover:bg-secondary-light hover:border-secondary transition-all duration-300"
          >
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
              <Home className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">I have a room to offer</div>
              <div className="text-sm text-muted-foreground">Lister</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};