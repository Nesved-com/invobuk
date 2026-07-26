import { forwardRef } from 'react'
import type { Company, Customer, DeliveryChallan } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  document: DeliveryChallan
  company: Company
  customer?: Customer
}

const s = {
  page: { width: '210mm', minHeight: '297mm', padding: '8mm 10mm', boxSizing: 'border-box', fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#111', backgroundColor: '#fff' } as React.CSSProperties,
  box: { border: '1px solid #333' },
  td: { border: '1px solid #333', padding: '6px 10px', fontSize: '13px', verticalAlign: 'top' as const },
}

const ChallanTemplate = forwardRef<HTMLDivElement, Props>(({ document: doc, company, customer }, ref) => {
  return (
    <div ref={ref} style={{ ...s.page, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'right', fontWeight: '700', marginBottom: '6px' }}>
        Date : {formatDate(doc.date)}
      </div>

      <div style={{ ...s.box, display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
        <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '22px', padding: '10px', borderBottom: '1px solid #333' }}>
          {company.name}
        </div>
        <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '13px', padding: '8px 10px', borderBottom: '1px solid #333' }}>
          Office: {company.address} {company.city} {company.pincode}, Mo-{company.phone} , Email : {company.email}
        </div>
        <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '20px', padding: '8px', borderBottom: '1px solid #333' }}>
          DELIVERY CHALLAN
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ ...s.td, width: '50%', borderTop: 'none', borderLeft: 'none' }}>
                <div><strong>Name :</strong> {customer?.name}</div>
                <div><strong>Address :</strong> {customer?.address}</div>
                <div><strong>State :</strong> {customer?.state}</div>
                <div><strong>GST NO :</strong> {customer?.gstNumber}</div>
              </td>
              <td style={{ ...s.td, width: '50%', borderTop: 'none', borderRight: 'none' }}>
                <div><strong>DC -Date</strong> {formatDate(doc.date)}</div>
                <div><strong>DC No -</strong> {doc.number}</div>
                <div><strong>VENDER CODE -</strong> {doc.vendorCode}</div>
                <div><strong>PO No :</strong> {doc.poNumber}</div>
                <div><strong>PO Date :</strong> {doc.poDate ? formatDate(doc.poDate) : ''}</div>
                <div><strong>Our GST NO :</strong> {company.gstNumber}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ ...s.td, borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
                <div>Dear Sir,</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{doc.referenceNote} {doc.poNumber}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0', flex: '1', height: '1px' }}>
            <thead>
              <tr>
                <th style={{ ...s.td, width: '60px', textAlign: 'center', borderLeft: 'none' }}>Sr No</th>
                <th style={{ ...s.td, textAlign: 'center' }}>Description</th>
                <th style={{ ...s.td, width: '90px', textAlign: 'center' }}>Qty</th>
                <th style={{ ...s.td, width: '90px', textAlign: 'center', borderRight: 'none' }}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ ...s.td, textAlign: 'center', borderLeft: 'none' }}>{idx + 1}</td>
                  <td style={s.td}><strong>{item.description}</strong></td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ ...s.td, textAlign: 'center', borderRight: 'none' }}>{item.unit}</td>
                </tr>
              ))}
              <tr style={{ height: '100%' }}>
                {Array.from({ length: 4 }).map((__, j) => <td key={j} style={{ ...s.td, padding: 0, borderLeft: j === 0 ? 'none' : undefined, borderRight: j === 3 ? 'none' : undefined }}>&nbsp;</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 10px', borderTop: 'none' }}>
          <div>
            <div style={{ marginBottom: '40px' }}>Regards</div>
            <div style={{ fontWeight: '700' }}>{doc.preparedBy}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '4px', borderTop: '1px solid #333', paddingTop: '4px', minWidth: '160px' }}>Customer Signature</div>
          </div>
        </div>
      </div>
    </div>
  )
})

ChallanTemplate.displayName = 'ChallanTemplate'
export default ChallanTemplate
