import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Home, Trash2, Building, Beaker } from 'lucide-react';
import { getLeaseAnalyses, analyzeLease, deleteLeaseAnalysis } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useEscapeKey } from '../hooks/useEscapeKey';
import CardGridSkeleton from '../components/skeletons/CardGridSkeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 15;

export default function LeaseAnalyzer() {
  const navigate = useNavigate();
  const toast = useToast();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    leaseContent: '',
    propertyAddress: '',
    propertyType: '',
    landlord: '',
    tenant: '',
    monthlyRent: '',
    securityDeposit: '',
    leaseTerm: ''
  });

  useEscapeKey(() => setShowModal(false), showModal);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const loadData = async () => {
    try {
      const res = await getLeaseAnalyses();
      setAnalyses(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.leaseContent) return;
    setAnalyzing(true);
    setSubmitting(true);
    try {
      await analyzeLease(formData);
      toast.success('Lease analyzed successfully!');
      setShowModal(false);
      setFormData({ title: '', leaseContent: '', propertyAddress: '', propertyType: '', landlord: '', tenant: '', monthlyRent: '', securityDeposit: '', leaseTerm: '' });
      loadData();
    } catch (error) {
      console.error('Failed to analyze:', error);
      toast.error('Failed to analyze lease. Please try again.');
    } finally {
      setAnalyzing(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this analysis?')) {
      try {
        await deleteLeaseAnalysis(id);
        toast.success('Lease analysis deleted successfully.');
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete lease analysis.');
      }
    }
  };

  const filtered = useMemo(() =>
    analyses.filter(a =>
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [analyses, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Lease Analyzer</h1>
          <p className="text-gray-600">Analyze real estate leases for risks and opportunities</p>
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Lease Analyzer</h1>
          <p className="text-gray-600">Analyze real estate leases for risks and opportunities</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus size={20} />Analyze Lease
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search lease analyses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No lease analyses found"
          description={searchTerm ? `No results matching "${searchTerm}"` : 'Analyze real estate leases for risks and opportunities'}
          actionLabel={searchTerm ? undefined : 'Analyze Lease'}
          onAction={searchTerm ? undefined : () => setShowModal(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((a) => (
              <div key={a.id} onClick={() => navigate(`/ai-tools/lease-analyzer/${a.id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg"><Building className="text-orange-600" size={20} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${a.score >= 70 ? 'bg-green-100 text-green-700' : a.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      Score: {a.score}
                    </span>
                    <button onClick={(e) => handleDelete(a.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
                {a.propertyAddress && <p className="text-sm text-gray-600">{a.propertyAddress}</p>}
                <div className="flex items-center gap-2 mt-3">
                  {a.propertyType && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{a.propertyType}</span>}
                  {a.monthlyRent && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded">${a.monthlyRent}/mo</span>}
                </div>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            limit={ITEMS_PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Analyze Lease Agreement</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Beaker size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Load Sample Data</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setFormData({ title: 'Downtown Apartment Lease Review', propertyAddress: '456 Oak Avenue, Apt 12B, San Francisco, CA 94102', propertyType: 'Apartment', landlord: 'Bay Area Property Management LLC', tenant: 'Jane Smith', monthlyRent: '3500', securityDeposit: '7000', leaseTerm: '12 months', leaseContent: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement is entered into between Bay Area Property Management LLC ("Landlord") and Jane Smith ("Tenant") for the property located at 456 Oak Avenue, Apt 12B, San Francisco, CA 94102.

1. TERM: The lease term begins on March 1, 2025 and ends on February 28, 2026. Tenant must provide 60 days written notice before the end of the term, otherwise the lease automatically renews for another 12-month period at a 10% rent increase.

2. RENT: Monthly rent is $3,500 due on the 1st of each month. A late fee of $250 applies after the 3rd day. If rent is not received by the 5th, an additional $50 per day will be charged. Rent may be increased at any time with 30 days notice.

3. SECURITY DEPOSIT: Tenant shall pay $7,000 as security deposit. Landlord may use the deposit for any repairs, cleaning, or unpaid rent. Deposit will be returned within 60 days of move-out, minus deductions. Tenant may not use deposit as last month's rent.

4. MAINTENANCE: Tenant is responsible for ALL repairs and maintenance under $500 including plumbing, electrical, and appliance repairs. Tenant must maintain renter's insurance of at least $300,000. Landlord is not responsible for any personal property damage.

5. ENTRY: Landlord may enter the premises at any time for inspections, repairs, or showing to prospective tenants. No prior notice is required for emergency situations, which are defined at Landlord's sole discretion.

6. PETS: No pets of any kind are allowed. Violation results in immediate lease termination and forfeiture of security deposit.

7. ALTERATIONS: Tenant shall not make any alterations, decorations, or improvements without Landlord's prior written consent, including painting, hanging pictures, or installing shelving.

8. TERMINATION: Landlord may terminate this lease with 30 days notice for any reason. Tenant may terminate early only by paying a fee equal to 3 months rent plus forfeiting the security deposit.

9. SUBLETTING: Subletting or assignment is strictly prohibited. Any unauthorized occupant constitutes a material breach.

10. PARKING: One parking space is included. Landlord reserves the right to reassign or eliminate parking spaces at any time without rent reduction.` })} className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition">
                    SF Apartment Lease
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Commercial Office Space Lease', propertyAddress: '100 Business Park Drive, Suite 300, Austin, TX 78701', propertyType: 'Commercial Office', landlord: 'Pinnacle Commercial Real Estate', tenant: 'TechStart Inc.', monthlyRent: '8500', securityDeposit: '25500', leaseTerm: '36 months', leaseContent: `COMMERCIAL LEASE AGREEMENT

Between Pinnacle Commercial Real Estate ("Landlord") and TechStart Inc. ("Tenant") for Suite 300 at 100 Business Park Drive, Austin, TX 78701 (approx. 2,500 sq ft).

1. TERM: 36 months commencing April 1, 2025. No renewal option is provided; Tenant must negotiate renewal at market rate 6 months before expiration.

2. BASE RENT: $8,500/month ($40.80/sq ft/year). Annual escalation of 4% compounding. Triple Net (NNN) lease: Tenant additionally pays pro-rata share of property taxes, insurance, and Common Area Maintenance (CAM) charges, estimated at $2,100/month but subject to adjustment.

3. CAM CHARGES: Tenant pays proportional share (15%) of all building operating expenses including landscaping, security, management fees (5% of gross rent), and capital improvements amortized over 10 years. Landlord may estimate CAM charges and reconcile annually. Tenant has no audit rights.

4. IMPROVEMENTS: Tenant receives no tenant improvement allowance. All improvements become Landlord's property. Tenant must restore premises to original condition at lease end at Tenant's expense, including removal of all cabling, fixtures, and improvements.

5. ASSIGNMENT: Any assignment or subletting requires Landlord's consent, which may be withheld for any reason. If Tenant sublets at a higher rate, 75% of the profit goes to Landlord.

6. DEFAULT: If Tenant is more than 5 days late on any payment, Landlord may charge 5% late fee plus 18% annual interest. After 10 days, Landlord may terminate lease and accelerate all remaining rent for the full lease term.

7. PERSONAL GUARANTEE: All principals of TechStart Inc. must personally guarantee the lease obligations for the full term.

8. INSURANCE: Tenant must carry $2M general liability, $1M property insurance, and name Landlord as additional insured.

9. HVAC: Tenant is responsible for all HVAC maintenance, repair, and replacement regardless of the age or condition of the system at lease commencement.` })} className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition">
                    Commercial Office Lease
                  </button>
                  <button type="button" onClick={() => setFormData({ title: 'Retail Space Lease Analysis', propertyAddress: '789 Main Street, Chicago, IL 60601', propertyType: 'Retail Space', landlord: 'Midwest Retail Properties', tenant: 'Bright Coffee Co.', monthlyRent: '5200', securityDeposit: '15600', leaseTerm: '60 months', leaseContent: `RETAIL LEASE AGREEMENT

Between Midwest Retail Properties ("Landlord") and Bright Coffee Co. ("Tenant") for ground floor retail space at 789 Main Street, Chicago, IL 60601 (1,800 sq ft).

1. TERM: 60 months beginning June 1, 2025. One 5-year renewal option at 120% of the then-current market rate, exercisable with 12 months notice.

2. RENT: Base rent of $5,200/month. Percentage rent clause: Tenant pays additional 8% of gross sales exceeding $50,000/month. Tenant must provide monthly sales reports and allow Landlord to audit books.

3. OPERATING HOURS: Tenant must operate during mall/strip center hours (7am-10pm daily, including holidays). Failure to maintain operating hours for more than 3 consecutive days constitutes default. Tenant must be open for business within 30 days of lease commencement.

4. EXCLUSIVE USE: No exclusivity clause is provided. Landlord may lease adjacent spaces to competing businesses including other coffee shops or cafes.

5. SIGNAGE: All signage must be approved by Landlord. Tenant pays for signage installation and removal. Landlord may require signage changes at Tenant's expense to maintain building aesthetics.

6. COMMON AREA: CAM charges estimated at $1,500/month. Landlord has sole discretion over common area improvements and may pass through capital improvement costs to tenants.

7. EARLY TERMINATION: Tenant may terminate after 36 months by paying 6 months rent as termination fee plus forfeiting security deposit.

8. RADIUS RESTRICTION: Tenant shall not open another location within 10 miles of the premises during the lease term and for 2 years after expiration.

9. FOOD SERVICE: Tenant responsible for all health department compliance, grease trap maintenance, and exhaust system upkeep. Landlord not liable for any closures due to health violations.` })} className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition">
                    Retail Space Lease
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Title (optional)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., 123 Main St Apartment Lease" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                  <input type="text" value={formData.propertyAddress} onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})} placeholder="123 Main St, City, State" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <select value={formData.propertyType} onChange={(e) => setFormData({...formData, propertyType: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select type...</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Condo">Condo</option>
                    <option value="Commercial Office">Commercial Office</option>
                    <option value="Retail Space">Retail Space</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Warehouse">Warehouse</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Name</label>
                  <input type="text" value={formData.landlord} onChange={(e) => setFormData({...formData, landlord: e.target.value})} placeholder="Property owner name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                  <input type="text" value={formData.tenant} onChange={(e) => setFormData({...formData, tenant: e.target.value})} placeholder="Tenant/Renter name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                  <input type="number" value={formData.monthlyRent} onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})} placeholder="2000" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit ($)</label>
                  <input type="number" value={formData.securityDeposit} onChange={(e) => setFormData({...formData, securityDeposit: e.target.value})} placeholder="4000" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Term</label>
                  <input type="text" value={formData.leaseTerm} onChange={(e) => setFormData({...formData, leaseTerm: e.target.value})} placeholder="12 months" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lease Agreement Content *</label>
                <textarea value={formData.leaseContent} onChange={(e) => setFormData({...formData, leaseContent: e.target.value})} placeholder="Paste the full lease agreement text here..." rows={10} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Home className="text-orange-600 flex-shrink-0" size={20} />
                  <p className="text-sm text-orange-700">Our AI will analyze the lease for key terms, risks, and provide recommendations from a tenant's perspective.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleAnalyze} disabled={!formData.leaseContent || analyzing || submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
                  {analyzing ? 'Analyzing...' : 'Analyze Lease'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
