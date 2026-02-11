# Invoice Creation Page - Professional Tabbed Interface Implementation

## Overview
This document provides the implementation for a professional tabbed interface for invoice creation with:
1. **Tab 1: Create Invoice** - Main invoice details, design options, customer info, and items
2. **Tab 2: Signature Settings** - Signature pad with enable/disable toggle
3. **Tab 3: Notes & Terms** - Professional notes and terms with enable/disable toggles and suggestions

## Backend Changes (Already Done ✅)
- Added `signatureEnabled`, `notesEnabled`, `termsEnabled` fields to invoice model
- Updated TypeScript interfaces

## Frontend Implementation

### Step 1: Import Additional Components
Add these imports at the top of `page.tsx` (around line 7):

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { PenTool, StickyNote, Shield, FileSignature } from 'lucide-react';
```

### Step 2: Add Default Text Constants
Add these constants after imports (around line 23):

```typescript
// Professional default texts
const DEFAULT_NOTES = `Thank you for your business!
We appreciate your trust and partnership.
For any queries, please contact us at your convenience.`;

const DEFAULT_TERMS = `1. Payment is due within 30 days of invoice date.
2. Late payments may incur additional charges.
3. All payments should be made to the specified account.
4. Goods once sold are not returnable.
5. Subject to our standard terms and conditions.`;

const NOTES_SUGGESTIONS = [
    'Thank you for your business! We appreciate your trust and partnership.',
    'We look forward to serving you again. Thank you for choosing us!',
    'Your satisfaction is our priority. Please contact us for any assistance.',
    'Thank you for your prompt payment and continued support.',
];

const TERMS_SUGGESTIONS = [
    'Payment due within 30 days. Late fees may apply.',
    'All sales are final. No refunds or exchanges.',
    'Payment due upon receipt. Overdue accounts subject to interest charges.',
    'Net 30 days. 2% discount if paid within 10 days.',
];
```

### Step 3: Add Tab State
Add this state variable (around line 30):

```typescript
const [activeTab, setActiveTab] = useState('invoice');
```

### Step 4: Update Initial Form Data
In the formData useState (around line 30-56), add these fields:

```typescript
notesEnabled: false,
termsEnabled: false,
signatureEnabled: false,
```

### Step 5: Add Helper Function
Add this helper function after formatCurrency (around line 227):

```typescript
const applySuggestion = (type: 'notes' | 'terms', text: string) => {
    if (type === 'notes') {
        handleInputChange('notes', text);
        handleInputChange('notesEnabled', true);
    } else {
        handleInputChange('terms', text);
        handleInputChange('termsEnabled', true);
    }
};
```

### Step 6: Main UI Structure Changes
Replace the entire content after the Page Header (around line 267) with the tabbed interface structure below.

## Complete Tabbed UI Structure

```tsx
{/* Tabbed Interface */}
<div className="max-w-7xl mx-auto">
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid h-auto bg-white border-2 border-gray-200 p-1 rounded-xl shadow-lg">
            <TabsTrigger 
                value="invoice" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-4 md:px-6 rounded-lg font-semibold transition-all"
            >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Invoice</span>
            </TabsTrigger>
            <TabsTrigger 
                value="signature" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-4 md:px-6 rounded-lg font-semibold transition-all"
            >
                <PenTool className="h-4 w-4" />
                <span className="hidden sm:inline">Signature</span>
                <span className="sm:hidden">Sign</span>
            </TabsTrigger>
            <TabsTrigger 
                value="notes" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white py-3 px-4 md:px-6 rounded-lg font-semibold transition-all"
            >
                <StickyNote className="h-4 w-4" />
                <span className="hidden sm:inline">Notes & Terms</span>
                <span className="sm:hidden">Notes</span>
            </TabsTrigger>
        </TabsList>

        {/* Tab 1: Create Invoice Content */}
        <TabsContent value="invoice" className="space-y-6">
            {/* Keep all existing invoice creation sections here:
                - Design Options Card
                - Customer Details + Summary Section  
                - Invoice Details Card
                - Customer Details Card
                - Invoice Items Card
                
                NOTE: REMOVE the old "Signature & Company Details" and "Notes & Terms" cards
                      as they will now be in separate tabs
            */}
        </TabsContent>

        {/* Tab 2: Signature Settings */}
        <TabsContent value="signature" className="space-y-6">
            <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50">
                <CardHeader className="border-b-2 border-purple-500 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/10 pb-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                                <FileSignature className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                                    Signature Settings
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    Add your professional signature to invoices
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 border-purple-200 shadow-sm">
                            <Label htmlFor="signature-toggle" className="text-sm font-bold text-gray-700 cursor-pointer">
                                Enable Signature
                            </Label>
                            <Switch
                                id="signature-toggle"
                                checked={formData.signatureEnabled || false}
                                onCheckedChange={(checked) => handleInputChange('signatureEnabled', checked)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 md:p-12">
                    {formData.signatureEnabled ? (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Signature Pad */}
                                <div className="space-y-4">
                                    <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                                        <div className="w-2 h-4 bg-purple-500 rounded-full"></div>
                                        Draw Your Signature
                                    </Label>
                                    <SignaturePad
                                        initialSignature={formData.signature}
                                        onSave={(sig) => handleInputChange('signature', sig)}
                                        onClear={() => handleInputChange('signature', '')}
                                    />
                                    <p className="text-xs text-gray-500 flex items-start gap-2">
                                        <span className="text-purple-600">💡</span>
                                        <span>Draw your signature using mouse or touch. It will appear on your invoices.</span>
                                    </p>
                                </div>

                                {/* Signature Name */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="signatureName" className="text-base font-bold text-gray-800 flex items-center gap-2">
                                            <div className="w-2 h-4 bg-indigo-500 rounded-full"></div>
                                            Signature Name/Title
                                        </Label>
                                        <Input
                                            id="signatureName"
                                            value={formData.signatureName}
                                            onChange={(e) => handleInputChange('signatureName', e.target.value)}
                                            placeholder="e.g., Authorized Signatory"
                                            className="h-14 text-base border-2 border-gray-200 focus:border-indigo-500 rounded-xl font-medium"
                                        />
                                        <p className="text-xs text-gray-500">
                                            This will appear below your signature
                                        </p>
                                    </div>

                                    {/* Info Box */}
                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-100">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Shield className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-purple-900 mb-2">
                                                    Professional Appearance
                                                </p>
                                                <p className="text-xs text-purple-700 leading-relaxed">
                                                    Your signature adds authenticity and professionalism to your invoices. 
                                                    It appears on "Modern" and "Professional" templates.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-6 shadow-inner">
                                <FileSignature className="h-12 w-12 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Signature is Disabled</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Enable signature to add your professional signature to invoices. 
                                This feature enhances trust and authenticity.
                            </p>
                            <Button
                                onClick={() => handleInputChange('signatureEnabled', true)}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 gap-2"
                            >
                                <PenTool className="h-4 w-4" />
                                Enable Signature
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* Tab 3: Notes & Terms */}
        <TabsContent value="notes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notes Card */}
                <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-amber-50 via-white to-yellow-50">
                    <CardHeader className="border-b-2 border-amber-500 bg-gradient-to-r from-amber-600/10 via-yellow-600/10 to-amber-600/10 pb-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl shadow-lg">
                                        <StickyNote className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                                            Invoice Notes
                                        </CardTitle>
                                        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                            Add special instructions or thank you messages
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border-2 border-amber-200 shadow-sm">
                                <Label htmlFor="notes-toggle" className="text-sm font-bold text-gray-700 cursor-pointer flex-1">
                                    Include Notes in Invoice
                                </Label>
                                <Switch
                                    id="notes-toggle"
                                    checked={formData.notesEnabled || false}
                                    onCheckedChange={(checked) => handleInputChange('notesEnabled', checked)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        {formData.notesEnabled ? (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="notes" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                        Your Notes
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        placeholder="Enter your notes here..."
                                        rows={6}
                                        className="text-sm border-2 border-gray-200 focus:border-amber-500 rounded-xl resize-none bg-white font-medium leading-relaxed"
                                    />
                                </div>

                                {/* Quick Suggestions */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                        Quick Suggestions
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {NOTES_SUGGESTIONS.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => applySuggestion('notes', suggestion)}
                                                className="text-left p-3 text-xs bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 rounded-lg border border-amber-200 hover:border-amber-400 transition-all text-gray-700 hover:text-gray-900 font-medium"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <p className="text-xs text-gray-700 flex items-start gap-2">
                                        <span className="text-amber-600 text-sm">💡</span>
                                        <span>Notes appear at the bottom of your invoice. Use them for thank you messages, special instructions, or payment reminders.</span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-xl mb-4">
                                    <StickyNote className="h-10 w-10 text-amber-600" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Notes Disabled</h4>
                                <p className="text-sm text-gray-600 mb-4">Enable to add notes to your invoices</p>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        handleInputChange('notesEnabled', true);
                                        handleInputChange('notes', DEFAULT_NOTES);
                                    }}
                                    className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
                                >
                                    Enable with Default Text
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Terms Card */}
                <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50">
                    <CardHeader className="border-b-2 border-teal-500 bg-gradient-to-r from-teal-600/10 via-cyan-600/10 to-teal-600/10 pb-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl shadow-lg">
                                        <Shield className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                                            Terms & Conditions
                                        </CardTitle>
                                        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                            Set payment terms and business policies
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border-2 border-teal-200 shadow-sm">
                                <Label htmlFor="terms-toggle" className="text-sm font-bold text-gray-700 cursor-pointer flex-1">
                                    Include Terms & Conditions
                                </Label>
                                <Switch
                                    id="terms-toggle"
                                    checked={formData.termsEnabled || false}
                                    onCheckedChange={(checked) => handleInputChange('termsEnabled', checked)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        {formData.termsEnabled ? (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="terms" className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                                        Your Terms
                                    </Label>
                                    <Textarea
                                        id="terms"
                                        value={formData.terms}
                                        onChange={(e) => handleInputChange('terms', e.target.value)}
                                        placeholder="Enter your terms and conditions..."
                                        rows={6}
                                        className="text-sm border-2 border-gray-200 focus:border-teal-500 rounded-xl resize-none bg-white font-medium leading-relaxed"
                                    />
                                </div>

                                {/* Quick Suggestions */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                        Quick Suggestions
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {TERMS_SUGGESTIONS.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => applySuggestion('terms', suggestion)}
                                                className="text-left p-3 text-xs bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 rounded-lg border border-teal-200 hover:border-teal-400 transition-all text-gray-700 hover:text-gray-900 font-medium"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                                    <p className="text-xs text-gray-700 flex items-start gap-2">
                                        <span className="text-teal-600 text-sm">📋</span>
                                        <span>Terms and conditions protect your business. They appear at the bottom of invoices and set clear payment expectations.</span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-xl mb-4">
                                    <Shield className="h-10 w-10 text-teal-600" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Terms Disabled</h4>
                                <p className="text-sm text-gray-600 mb-4">Enable to add terms to your invoices</p>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        handleInputChange('termsEnabled', true);
                                        handleInputChange('terms', DEFAULT_TERMS);
                                    }}
                                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                                >
                                    Enable with Default Text
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    </Tabs>
</div>

{/* Keep Mobile Bottom Bar and Preview Dialog as is */}
```

## Notes
1. The signature, notes, and terms sections from the old invoice tab should be removed
2. Keep all other existing sections (Design Options, Customer Details, Invoice Items, etc.) in Tab 1
3. The mobile bottom bar stays outside the tabs
4. Preview functionality remains unchanged

## Testing Checklist
- [ ] Tabs switch correctly
- [ ] Enable/disable toggles work for signature, notes, and terms
- [ ] Default text suggestions apply correctly
- [ ] Form data is preserved when switching tabs
- [ ] Invoice creation includes all new fields
- [ ] PDF generation respects enable/disable flags
