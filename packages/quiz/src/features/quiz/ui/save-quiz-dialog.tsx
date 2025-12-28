import { Button, Dialog, Label } from "@shadcn";
import { GitBranchIcon, SaveIcon } from "lucide-react";
import React from "react";
import { incrementSemver } from "./version-increment-dialog.js";

type SaveQuizDialogProps = {
  currentVersion: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: "save" | "saveAsNew", newVersion?: string) => void;
  title?: string;
  quizTitle: string;
};

export const SaveQuizDialog: React.FC<SaveQuizDialogProps> = ({
  currentVersion,
  isOpen,
  onClose,
  onConfirm,
  title = "Save Quiz Changes",
  quizTitle,
}) => {
  const [saveAction, setSaveAction] = React.useState<"save" | "saveAsNew">("save");
  const [incrementType, setIncrementType] = React.useState<"major" | "minor" | "patch">("patch");

  const newVersion = incrementSemver(currentVersion, incrementType);

  const handleConfirm = () => {
    if (saveAction === "saveAsNew") {
      onConfirm(saveAction, newVersion);
    } else {
      onConfirm(saveAction);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className="sm:max-w-[500px]">
        <Dialog.Header>
          <Dialog.Title className="flex items-center gap-2">
            <SaveIcon className="h-5 w-5" />
            {title}
          </Dialog.Title>
          <Dialog.Description>
            Choose how to save your changes to "{quizTitle}". You can overwrite the current version
            or create a new version.
          </Dialog.Description>
        </Dialog.Header>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            {/* Save over current version */}
            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="save"
                name="saveAction"
                value="save"
                checked={saveAction === "save"}
                onChange={(e) => {
                  setSaveAction(e.target.value as "save" | "saveAsNew");
                }}
                className="mt-1 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="save" className="font-medium cursor-pointer">
                  Save Changes (v{currentVersion})
                </Label>
                <p className="text-xs text-muted-foreground">
                  Overwrite the current version with your changes. This cannot be undone.
                </p>
              </div>
            </div>

            {/* Save as new version */}
            <div className="flex items-start space-x-2">
              <input
                type="radio"
                id="saveAsNew"
                name="saveAction"
                value="saveAsNew"
                checked={saveAction === "saveAsNew"}
                onChange={(e) => {
                  setSaveAction(e.target.value as "save" | "saveAsNew");
                }}
                className="mt-1 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="saveAsNew" className="font-medium cursor-pointer">
                  Save as New Version (v{newVersion})
                </Label>
                <p className="text-xs text-muted-foreground">
                  Create a new version, preserving the original. Choose increment type below.
                </p>
              </div>
            </div>
          </div>

          {/* Version increment options - only show when "saveAsNew" is selected */}
          {saveAction === "saveAsNew" && (
            <div className="ml-6 pl-4 border-l border-border space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Version Increment:</div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="patch-save"
                    name="incrementType"
                    value="patch"
                    checked={incrementType === "patch"}
                    onChange={(e) => {
                      setIncrementType(e.target.value as "major" | "minor" | "patch");
                    }}
                    className="mt-0.5 h-3 w-3 text-primary focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor="patch-save" className="text-xs font-medium cursor-pointer">
                      Patch (v{incrementSemver(currentVersion, "patch")}) - Bug fixes
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="minor-save"
                    name="incrementType"
                    value="minor"
                    checked={incrementType === "minor"}
                    onChange={(e) => {
                      setIncrementType(e.target.value as "major" | "minor" | "patch");
                    }}
                    className="mt-0.5 h-3 w-3 text-primary focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor="minor-save" className="text-xs font-medium cursor-pointer">
                      Minor (v{incrementSemver(currentVersion, "minor")}) - New features
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="major-save"
                    name="incrementType"
                    value="major"
                    checked={incrementType === "major"}
                    onChange={(e) => {
                      setIncrementType(e.target.value as "major" | "minor" | "patch");
                    }}
                    className="mt-0.5 h-3 w-3 text-primary focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor="major-save" className="text-xs font-medium cursor-pointer">
                      Major (v{incrementSemver(currentVersion, "major")}) - Breaking changes
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Dialog.Footer>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            {saveAction === "save" ? (
              <>
                <SaveIcon className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <GitBranchIcon className="h-4 w-4" />
                Save as v{newVersion}
              </>
            )}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
