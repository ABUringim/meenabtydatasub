import React, { useState } from 'react';
import { ProductItem, ServiceCategory } from '../../../types';
import { adminProductsService } from '../../../lib/admin/adminProducts';
import { Modal } from '../../shared/Modal';
import { Upload, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { formatNgnFromKobo } from '../../../lib/formatters';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  actorId: string;
  actorName: string;
  onSuccess: (count: number) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  actorId,
  actorName,
  onSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ProductItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  const sampleCsv = `provider,service,planCode,name,basePriceNgn,userPriceNgn,agentPriceNgn,vendorPriceNgn
MTN,data,mtn_sme_1gb,MTN SME 1.0GB (30 Days),240,265,255,248
MTN,data,mtn_sme_2gb,MTN SME 2.0GB (30 Days),480,530,510,495
Airtel,data,airtel_cg_1gb,Airtel Corporate Gifting 1GB,270,295,285,278
Glo,data,glo_sme_1gb,Glo SME Data 1.0GB,220,245,235,228
KEDCO,electricity,kedco_prepaid,KEDCO Prepaid Meter Token,0,100,50,0
WAEC,exam,waec_pin,WAEC Result Checker PIN,3200,3500,3400,3300`;

  const handleParse = () => {
    setParseErrors([]);
    setParsedProducts([]);
    const lines = inputText.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors(['Input must include header row and at least one product data row.']);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const validCols = ['provider', 'service', 'plancode', 'name', 'basepricengn', 'userpricengn'];
    const hasRequired = validCols.every((col) => headers.includes(col));
    if (!hasRequired) {
      setParseErrors([
        `Missing required columns. Header must include: ${validCols.join(', ')}`,
      ]);
      return;
    }

    const products: ProductItem[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < headers.length) {
        errors.push(`Row ${i + 1}: Insufficient columns`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] || '';
      });

      const provider = row['provider'];
      const service = row['service'] as ServiceCategory;
      const planCode = row['plancode'];
      const name = row['name'];
      const basePriceNgn = parseFloat(row['basepricengn'] || '0');
      const userPriceNgn = parseFloat(row['userpricengn'] || '0');
      const agentPriceNgn = parseFloat(row['agentpricengn'] || row['userpricengn'] || '0');
      const vendorPriceNgn = parseFloat(row['vendorpricengn'] || row['basepricengn'] || '0');

      if (!provider || !service || !planCode || !name || isNaN(userPriceNgn)) {
        errors.push(`Row ${i + 1}: Invalid data formats for required fields.`);
        continue;
      }

      const item: ProductItem = {
        id: `prod_${service}_${planCode}_${Date.now()}_${i}`,
        provider,
        service,
        plan_code: planCode,
        name,
        cost_price: Math.round(basePriceNgn * 100),
        selling_price: Math.round(userPriceNgn * 100),
        base_price: Math.round(basePriceNgn * 100),
        user_price: Math.round(userPriceNgn * 100),
        agent_price: Math.round(agentPriceNgn * 100),
        vendor_price: Math.round(vendorPriceNgn * 100),
        active: true,
      };

      products.push(item);
    }

    setParseErrors(errors);
    setParsedProducts(products);
    setPreviewActive(products.length > 0);
  };

  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;
    setIsProcessing(true);
    try {
      await adminProductsService.bulkImportProducts(parsedProducts, actorId, actorName);
      onSuccess(parsedProducts.length);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Catalog Products"
      subtitle="Rapidly load wholesale plans, DisCo tokens, or examination PIN SKUs"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {!previewActive ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Paste CSV or Comma-Separated Data
              </label>
              <button
                type="button"
                onClick={() => setInputText(sampleCsv)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Load Sample Template</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw CSV lines here..."
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />

            {parseErrors.length > 0 && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl space-y-1">
                <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Validation Errors:
                </p>
                <ul className="text-[11px] text-rose-200 list-disc pl-4 space-y-0.5">
                  {parseErrors.slice(0, 4).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {parseErrors.length > 4 && <li>...and {parseErrors.length - 4} more errors</li>}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={!inputText.trim()}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Parse & Preview</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-semibold">
                  Successfully parsed {parsedProducts.length} product(s) ready to import.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewActive(false)}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Edit Raw Input
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold sticky top-0">
                    <th className="py-2.5 px-3">Service & Provider</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Plan Code</th>
                    <th className="py-2.5 px-3 text-right">User Price</th>
                    <th className="py-2.5 px-3 text-right">Agent Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {parsedProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3">
                        <span className="text-emerald-400 font-bold uppercase">{p.provider}</span>{' '}
                        <span className="text-slate-400">({p.service})</span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-white">{p.name}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{p.plan_code}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-400 font-semibold">
                        {formatNgnFromKobo(p.user_price ?? p.selling_price ?? 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">
                        {formatNgnFromKobo(p.agent_price ?? p.selling_price ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPreviewActive(false)}
                className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Back to Edit
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Importing...' : `Confirm Import (${parsedProducts.length} items)`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
