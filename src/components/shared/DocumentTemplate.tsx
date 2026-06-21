import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { BaseDocument, Company, Customer } from '@/types'
import { formatCurrency, formatDate, numberToWords } from '@/lib/utils'
import { getStateCode } from '@/lib/states'

type DocWithExtras = BaseDocument & {
  type: string
  validUntil?: string
  expectedDelivery?: string
  kindAttention?: string
  enquirySource?: string
  enquiryDate?: string
}

interface Props {
  document: DocWithExtras
  company: Company
  customer?: Customer
}

const s = {
  page: { width: '210mm', minHeight: '297mm', padding: '8mm 10mm', fontSize: '10px', fontFamily: 'Arial, sans-serif', color: '#111', backgroundColor: '#fff' } as React.CSSProperties,
  headerTitle: { textAlign: 'center' as const, fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '2px' },
  headerSub: { textAlign: 'center' as const, fontSize: '13px', color: '#333', marginBottom: '1px' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { border: '1px solid #aaa', padding: '4px 5px', background: '#e8e8e8', fontWeight: '700', textAlign: 'center' as const, fontSize: '13px' },
  td: { border: '1px solid #aaa', padding: '4px 5px', fontSize: '13px', verticalAlign: 'top' as const },
  tdRight: { border: '1px solid #aaa', padding: '4px 5px', fontSize: '13px', textAlign: 'right' as const },
  tdCenter: { border: '1px solid #aaa', padding: '4px 5px', fontSize: '13px', textAlign: 'center' as const },
  label: { fontSize: '12.5px', color: '#555', marginRight: '4px' },
  value: { fontWeight: '600' },
  section: { border: '1px solid #aaa', padding: '5px 7px', marginBottom: '0' },
}

function InvoiceStyleTemplate({ document: doc, company, customer, title, numberLabel, dateLabel }: Props & { title: string; numberLabel: string; dateLabel: string }) {
  const shipTo = doc.shipToSame ? customer : (doc.shipTo || customer)
  const intra = doc.gstType === 'intra'

  // Extra invoice fields
  const inv = doc as any
  const tcsPercent = inv.tcsPercent ?? 0
  const remarks = inv.remarks || ''
  const schemeVal = inv.schemeDiscount ?? 0
  const cashDiscPct = inv.cashDiscountPercent ?? 0
  const cashDiscAmt = doc.subtotal * cashDiscPct / 100
  const netAmount = doc.grandTotal
  const tcsAmt = netAmount * tcsPercent / 100
  const rounded = Math.round(netAmount + tcsAmt)

  const n = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div style={{ ...s.page, fontSize: '12.5px', display: 'flex', flexDirection: 'column' }}>

      {/* Title */}
      <div style={{ position: 'relative', textAlign: 'center', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
        {title}
        {doc.copyType && (
          <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '11px', fontWeight: '700' }}>{doc.copyType}</span>
        )}
      </div>

      {/* Invoice details — top section */}
      <table style={{ ...s.table, marginBottom: '3px' }}>
        <tbody>
          <tr>
            <td style={{ ...s.td, width: '55%', verticalAlign: 'top' }}>
              <div style={{ marginBottom: '4px' }}>
                <div style={{ fontWeight: '900', fontSize: '16px' }}>{company.name}</div>
                <div style={{ fontSize: '13px', marginTop: '2px' }}>{company.address}</div>
                <div style={{ fontSize: '13px' }}>{company.city}, {company.state} - {company.pincode}</div>
                <div style={{ fontSize: '13px' }}><strong>GSTIN/UIN:</strong>{company.gstNumber}</div>
                <div style={{ fontSize: '13px' }}><strong>State Name:</strong>{company.state} , <strong>State Code :</strong> {company.stateCode || getStateCode(company.state)}</div>
                <div style={{ fontSize: '13px' }}><strong>E-Mail:</strong>{company.email}</div>
                <div style={{ fontSize: '13px' }}><strong>Phone:</strong> {company.phone}</div>
                <div style={{ fontSize: '13px' }}><strong>Companys PAN:</strong>{company.panNumber}</div>
              </div>
            </td>
            <td style={{ ...s.td, width: '45%', verticalAlign: 'top' }}>
              <table style={s.table}>
                <tbody>
                  <tr>
                    <td style={{ ...s.td, width: '45%', fontWeight: '700', fontSize: '13px' }}>{numberLabel}</td>
                    <td style={s.td}>{doc.number}</td>
                  </tr>
                  <tr>
                    <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>{dateLabel}</td>
                    <td style={s.td}>{formatDate(doc.date)}</td>
                  </tr>
                  {doc.type === 'quotation' ? (
                    <>
                      <tr>
                        <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>Enquiry Type</td>
                        <td style={s.td}>{doc.enquirySource}</td>
                      </tr>
                      <tr>
                        <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>Enquiry Date</td>
                        <td style={s.td}>{doc.enquiryDate ? formatDate(doc.enquiryDate) : ''}</td>
                      </tr>
                    </>
                  ) : doc.type === 'invoice' ? (
                    <>
                      <tr>
                        <td style={{ ...s.td, fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>Reverse Charge (Y/N)</td>
                        <td style={s.td}>{doc.reverseCharge ? 'Y' : 'N'}</td>
                      </tr>
                      <tr>
                        <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>P.O. No</td>
                        <td style={s.td}>{doc.poNumber}</td>
                      </tr>
                      <tr>
                        <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>P.O. Date</td>
                        <td style={s.td}>{doc.poDate ? formatDate(doc.poDate) : ''}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>Expected Delivery</td>
                      <td style={s.td}>{(doc as any).expectedDelivery ? formatDate((doc as any).expectedDelivery) : ''}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>Terms of Payment</td>
                    <td style={s.td}>{doc.paymentTerms || '0'}</td>
                  </tr>
                  <tr>
                    <td style={{ ...s.td, fontWeight: '700', fontSize: '13px' }}>Vendor Code</td>
                    <td style={s.td}>{doc.vendorCode}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Buyer Billing + Shipping (Quotation only needs the billing side) */}
      <table style={{ ...s.table, marginBottom: '3px' }}>
        <tbody>
          <tr>
            <td style={{ ...s.td, width: doc.type === 'invoice' ? '50%' : '100%', verticalAlign: 'top' }}>
              <div style={{ fontWeight: '700', marginBottom: '3px', fontSize: '13px' }}>
                {doc.type === 'quotation' ? 'Quotation For' : 'Buyer (Billing Address)'}
              </div>
              <div style={{ fontWeight: '900', fontSize: '16px' }}>{customer?.name}</div>
              <div>{customer?.address}</div>
              <div><strong>Phone:</strong>{customer?.phone}</div>
              <div><strong>GSTIN/UIN:</strong>{customer?.gstNumber}</div>
              <div><strong>State Name :</strong> {customer?.state} , <strong>State Code :</strong> {customer?.stateCode || getStateCode(customer?.state)}</div>
              {doc.type === 'quotation' && doc.kindAttention && (
                <div><strong>Kind Attention :</strong> {doc.kindAttention}</div>
              )}
            </td>
            {doc.type === 'invoice' && (
              <td style={{ ...s.td, width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontWeight: '700', marginBottom: '3px', fontSize: '13px' }}>Buyer (Shipping Address)</div>
                <div style={{ fontWeight: '900', fontSize: '16px' }}>{shipTo?.name}</div>
                <div>{shipTo?.address}</div>
                <div><strong>Phone:</strong>{shipTo?.phone}</div>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {/* Line Items — flex-grows to fill the rest of the A4 page when there are only a
          few rows; if items overflow one page, this naturally takes its own content size
          and the rest just flows onto the next printed page, no shrinking involved. */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
        <table style={{ ...s.table, marginBottom: '0', flex: '1', height: '1px' }}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: '22px' }}>Sr<br/>No</th>
              <th style={s.th}>Description Of Goods</th>
              <th style={{ ...s.th, width: '52px' }}>HSN Code</th>
              <th style={{ ...s.th, width: '28px' }}>Qty</th>
              <th style={{ ...s.th, width: '40px' }}>UOM</th>
              <th style={{ ...s.th, width: '50px' }}>Rate</th>
              <th style={{ ...s.th, width: '60px' }}>Amount</th>
              {doc.type !== 'quotation' && <th style={{ ...s.th, width: '32px' }}>Disc%</th>}
              <th style={{ ...s.th, width: '32px' }}>GST%</th>
              <th style={{ ...s.th, width: '58px' }}>Line Amount</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, idx) => {
              const lineAmt = intra ? item.amount + item.cgst + item.sgst : item.amount + item.igst
              return (
                <tr key={item.id}>
                  <td style={s.tdCenter}>{idx + 1}</td>
                  <td style={s.td}><strong>{item.description}</strong></td>
                  <td style={s.tdCenter}>{item.hsnCode}</td>
                  <td style={s.tdCenter}>{item.quantity}</td>
                  <td style={s.tdCenter}>{item.unit}</td>
                  <td style={s.tdRight}>{n(item.rate)}</td>
                  <td style={s.tdRight}>{n(item.quantity * item.rate)}</td>
                  {doc.type !== 'quotation' && <td style={s.tdCenter}>{item.discount || 0}%</td>}
                  <td style={s.tdCenter}>{item.gstRate}%</td>
                  <td style={s.tdRight}>{n(lineAmt)}</td>
                </tr>
              )
            })}
            <tr style={{ height: '100%' }}>
              {Array.from({ length: doc.type === 'quotation' ? 9 : 10 }).map((__, j) => <td key={j} style={{ ...s.td, padding: 0 }}>&nbsp;</td>)}
            </tr>
            <tr style={{ fontWeight: '700', background: '#f5f5f5' }}>
              <td style={s.td} colSpan={3}>Total</td>
              <td style={s.tdCenter}>{doc.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
              <td style={s.td}></td>
              <td style={s.td}></td>
              <td style={s.tdRight}>{n(doc.items.reduce((sum, i) => sum + i.quantity * i.rate, 0))}</td>
              {doc.type !== 'quotation' && <td style={s.td}></td>}
              <td style={s.td}></td>
              <td style={s.tdRight}>
                {n(doc.items.reduce((sum, i) => sum + (intra ? i.amount + i.cgst + i.sgst : i.amount + i.igst), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary rows — right-aligned amounts */}
      <table style={{ ...s.table, marginBottom: '0' }}>
        <tbody>
          <tr>
            <td style={{ ...s.td, width: '55%', borderRight: 'none' }} rowSpan={3 + (schemeVal ? 1 : 0) + (cashDiscPct ? 1 : 0) + (intra ? 2 : 1) + (tcsPercent ? 1 : 0)}></td>
            <td style={{ ...s.td, textAlign: 'right', fontWeight: '700', borderLeft: 'none' }}>Gross Amount</td>
            <td style={{ ...s.tdRight, width: '70px' }}>{n(doc.subtotal)}</td>
          </tr>
          {!!schemeVal && (
            <tr>
              <td style={{ ...s.td, textAlign: 'right' }}>Scheme Val</td>
              <td style={s.tdRight}>{n(schemeVal)}</td>
            </tr>
          )}
          {!!cashDiscPct && (
            <tr>
              <td style={{ ...s.td, textAlign: 'right' }}>Cash Discount {cashDiscPct}%</td>
              <td style={s.tdRight}>{n(cashDiscAmt)}</td>
            </tr>
          )}
          {intra && (
            <>
              <tr>
                <td style={{ ...s.td, textAlign: 'right' }}>CGST {doc.items[0]?.gstRate ? doc.items[0].gstRate / 2 : 0}%</td>
                <td style={s.tdRight}>{n(doc.totalCgst)}</td>
              </tr>
              <tr>
                <td style={{ ...s.td, textAlign: 'right' }}>SGST {doc.items[0]?.gstRate ? doc.items[0].gstRate / 2 : 0}%</td>
                <td style={s.tdRight}>{n(doc.totalSgst)}</td>
              </tr>
            </>
          )}
          {!intra && (
            <tr>
              <td style={{ ...s.td, textAlign: 'right' }}>IGST {doc.items[0]?.gstRate || 0}%</td>
              <td style={s.tdRight}>{n(doc.totalIgst)}</td>
            </tr>
          )}
          {!!tcsPercent && (
            <tr>
              <td style={{ ...s.td, textAlign: 'right' }}>TCS Amount {tcsPercent}%</td>
              <td style={s.tdRight}>{n(tcsAmt)}</td>
            </tr>
          )}
          <tr>
            <td style={{ ...s.td, textAlign: 'right', fontWeight: '700' }}>
              Total Amount
            </td>
            <td style={{ ...s.tdRight, fontWeight: '800' }}>{n(rounded)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in words + Remarks */}
      <table style={{ ...s.table, marginBottom: '3px' }}>
        <tbody>
          <tr>
            <td style={{ ...s.td, fontSize: '13px' }}>
              <strong>Amount chargeable (in words) : </strong>INR {numberToWords(rounded)}
            </td>
          </tr>
          {remarks && (
            <tr>
              <td style={{ ...s.td, fontSize: '13px' }}><strong>Remarks:</strong> {remarks}</td>
            </tr>
          )}
        </tbody>
      </table>


      {/* QR + Bank — not applicable to quotations */}
      {doc.type === 'invoice' && (
        <table style={{ ...s.table, marginBottom: '3px' }}>
          <tbody>
            <tr>
              <td style={{ ...s.td, width: '50%', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>Unique QR Code</div>
                  <QRCodeSVG
                    value={doc.number}
                    size={70}
                    level="L"
                  />
                </div>
              </td>
              <td style={{ ...s.td, width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontWeight: '700', marginBottom: '3px' }}>Company Bank Details</div>
                <div>Bank Name :{company.bankName}</div>
                <div>A/c No.:{company.accountNumber}</div>
                <div>Branch:{company.city} , {company.state.toUpperCase()}</div>
                <div>IFSC Code: {company.ifscCode}</div>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Terms + Signatory */}
      <table style={{ ...s.table, marginBottom: '3px' }}>
        <tbody>
          <tr>
            <td style={{ ...s.td, width: '60%', verticalAlign: 'top' }}>
              <div style={{ fontWeight: '700', textDecoration: 'underline', marginBottom: '3px', fontSize: '13px' }}>
                {doc.type === 'quotation' ? 'Note' : 'Terms & Condition'}
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                {doc.type === 'quotation' ? doc.notes : (doc.terms || company.declaration)}
              </div>
            </td>
            <td style={{ ...s.td, width: '40%', textAlign: 'right', verticalAlign: 'bottom' }}>
              <div style={{ fontWeight: '700', fontSize: '12.5px' }}>for {company.name.toUpperCase()}</div>
              <div style={{ marginTop: '28px', borderTop: '1px solid #999', paddingTop: '3px', fontSize: '13px' }}>Authorised Signatory</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function QuotationTemplate(props: Props) {
  return <InvoiceStyleTemplate {...props} title="Quotation" numberLabel="Quotation No" dateLabel="Quotation Date" />
}

function POTemplate(props: Props) {
  return <InvoiceStyleTemplate {...props} title="Purchase Order" numberLabel="Order No" dateLabel="Order Date" />
}

const DocumentTemplate = forwardRef<HTMLDivElement, Props>((props, ref) => {
  return (
    <div ref={ref}>
      {props.document.type === 'invoice' && <InvoiceStyleTemplate {...props} title="Tax Invoice" numberLabel="Invoice No" dateLabel="Invoice Date" />}
      {props.document.type === 'quotation' && <QuotationTemplate {...props} />}
      {props.document.type === 'purchase-order' && <POTemplate {...props} />}
    </div>
  )
})

DocumentTemplate.displayName = 'DocumentTemplate'
export default DocumentTemplate
