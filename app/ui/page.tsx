"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { CatalogueSection } from "@/components/ui/CatalogueSection";

export default function UiPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-semibold text-foreground mb-8">Component Catalogue</h1>

      <CatalogueSection title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="icon" aria-label="Icon button">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </CatalogueSection>

      <CatalogueSection title="Input">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Text input" />
          <Input type="date" />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <Input placeholder="Disabled input" disabled />
        </div>
      </CatalogueSection>

      <CatalogueSection title="Badge">
        <div className="flex flex-wrap items-center gap-3">
          <Badge color="#3B82F6">Category</Badge>
          <Badge color="#EF4444">Urgent</Badge>
          <Badge color="#22C55E">Done</Badge>
        </div>
      </CatalogueSection>

      <CatalogueSection title="Select">
        <Select defaultValue="a">
          <option value="a">Option A</option>
          <option value="b">Option B</option>
          <option value="c">Option C</option>
        </Select>
      </CatalogueSection>

      <CatalogueSection title="Checkbox">
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox aria-label="Unchecked" />
          <Checkbox defaultChecked aria-label="Checked" />
        </div>
      </CatalogueSection>

      <CatalogueSection title="Modal">
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
          <p className="text-sm text-foreground mb-4">
            This is an example modal. Press Escape or click the overlay to close.
          </p>
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        </Modal>
      </CatalogueSection>
    </div>
  );
}
