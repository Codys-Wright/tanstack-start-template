import { Button, Dialog, Label, Textarea } from "@shadcn";
import { ArrowUpIcon, GitBranchIcon } from "lucide-react";
import React from "react";

// Semver increment utilities
export const incrementSemver = (version: string, type: "major" | "minor" | "patch"): string => {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (type) {
    case "major":
      return `${(major ?? 0) + 1}.0.0`;
    case "minor":
      return `${major ?? 0}.${(minor ?? 0) + 1}.0`;
    case "patch":
      return `${major ?? 0}.${minor ?? 0}.${(patch ?? 0) + 1}`;
    default:
      return version;
  }
};

export const getVersionDescription = (type: "major" | "minor" | "patch"): string => {
  switch (type) {
    case "major":
      return "Breaking changes, incompatible API changes";
    case "minor":
      return "New features, backwards compatible";
    case "patch":
      return "Bug fixes, backwards compatible";
    default:
      return "";
  }
};

type VersionIncrementDialogProps = {
  currentVersion: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    newVersion: string,
    incrementType: "major" | "minor" | "patch",
    comment?: string,
  ) => void;
  title?: string;
};

export const VersionIncrementDialog: React.FC<VersionIncrementDialogProps> = ({
  currentVersion,
  isOpen,
  onClose,
  onConfirm,
  title = "Create New Version",
}) => {
  const [selectedType, setSelectedType] = React.useState<"major" | "minor" | "patch">("patch");
  const [comment, setComment] = React.useState("");

  const newVersion = incrementSemver(currentVersion, selectedType);

  const handleConfirm = () => {
    onConfirm(newVersion, selectedType, comment.trim().length > 0 ? comment.trim() : undefined);
    onClose();
  };

  const handleClose = () => {
    setComment(""); // Reset comment when closing
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Header>
          <Dialog.Title className="flex items-center gap-2">
            <GitBranchIcon className="h-5 w-5" />
            {title}
          </Dialog.Title>
          <Dialog.Description>
            Choose the type of version increment for your quiz. This will create a new draft
            version.
          </Dialog.Description>
        </Dialog.Header>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-version" className="text-right">
              Current
            </Label>
            <div className="col-span-3 px-3 py-2 bg-muted rounded-md text-sm font-mono">
              v{currentVersion}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-version" className="text-right">
              New
            </Label>
            <div className="col-span-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-md text-sm font-mono font-semibold">
              v{newVersion}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right mt-2">Type</Label>
            <div className="col-span-3">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="patch"
                    name="versionType"
                    value="patch"
                    checked={selectedType === "patch"}
                    onChange={(e) => {
                      setSelectedType(e.target.value as "major" | "minor" | "patch");
                    }}
                    className="mt-1 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="patch" className="font-medium cursor-pointer">
                      Patch ({incrementSemver(currentVersion, "patch")})
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {getVersionDescription("patch")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="minor"
                    name="versionType"
                    value="minor"
                    checked={selectedType === "minor"}
                    onChange={(e) => {
                      setSelectedType(e.target.value as "major" | "minor" | "patch");
                    }}
                    className="mt-1 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="minor" className="font-medium cursor-pointer">
                      Minor ({incrementSemver(currentVersion, "minor")})
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {getVersionDescription("minor")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="major"
                    name="versionType"
                    value="major"
                    checked={selectedType === "major"}
                    onChange={(e) => {
                      setSelectedType(e.target.value as "major" | "minor" | "patch");
                    }}
                    className="mt-1 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="major" className="font-medium cursor-pointer">
                      Major ({incrementSemver(currentVersion, "major")})
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {getVersionDescription("major")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="comment" className="text-right mt-2">
              Comment
            </Label>
            <div className="col-span-3">
              <Textarea
                id="comment"
                placeholder="Describe what changed in this version (optional)"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                }}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{comment.length}/500 characters</p>
            </div>
          </div>
        </div>

        <Dialog.Footer>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <ArrowUpIcon className="h-4 w-4" />
            Create v{newVersion}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
