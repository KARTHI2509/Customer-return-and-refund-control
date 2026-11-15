import React, { useState } from 'react';
import { 
  GraduationCap, 
  HelpCircle, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  Building2,
  Workflow
} from 'lucide-react';

export default function InterviewMasteryGuide({ onSelectReference }) {
  const [activeFaq, setActiveFaq] = useState(0);

  const faqs = [
    {
      q: "1. Why build this application when SAP S/4HANA already has Fiori 'Manage Customer Returns'?",
      a: "Standard SAP Fiori (App F2133) is transaction-oriented—it allows users to create and edit single return orders, but it does NOT provide an exception-centric view. Operational teams at SunGrid Renewables currently struggle because they must cross-reference multiple screens (VA01 for order creation, VL01N for return deliveries, VF01 for billing blocks, and QA32 for inspection lots). They drown in spreadsheets and emails. This application provides a role-based exception management layer that prioritizes high-risk items, diagnoses incompletion bottlenecks, calculates dynamic ageing, and provides human-in-the-loop recommendations without replacing SAP as the enterprise system of record."
    },
    {
      q: "2. How do you explain the exact reference transaction (INV-460008) in 2 minutes?",
      a: "Document INV-460008 represents SunGrid's primary demo case: Company Code 1300, Plant 1108 (Solar Module Fab), Storage Location SL11 (Returns Quarantine), Cost Centre CC-2208, Material Composite Panel CP-12, Amount £23,500, Requested Date 13 August 2026, Status 'Partially Processed', and Business Partner beginning with 'M... Stores'. What went wrong? The customer invoiced for 15 panels (£23,500), but warehouse physical inspection at SL11 confirmed only 10 panels arrived (5 retained by distributor). Furthermore, the return order was missing the mandatory Return Reason code required by SAP incompletion rules, causing a billing block. Our solution: Recommend adjusting the quantity to 10 units in VA02, assign reason '015 - Solar Panel Cell Fracture', and release a credit of £15,666.70—directly protecting SunGrid from a £7,833.30 erroneous cash credit."
    },
    {
      q: "3. What is SAP SD 'BKP' and how does it fit into SAP Signavio?",
      a: "BKP is the standard SAP S/4HANA best-practice scope item for 'Customer Returns'. In SAP Signavio's process hierarchy, it belongs to the end-to-end business process 'Lead to Cash > Returns Management'. BKP standardizes the physical and financial flow: Customer Return Order (CBRE) → Return Delivery (LR) with Goods Receipt (PGR) into quarantine stock → Technical Inspection → Billing/Credit Memo (G2) release. Our application models this exact document chain and highlights where exceptions depart from the expected Signavio flow."
    },
    {
      q: "4. How is Risk evaluated? Is high financial amount equal to high risk?",
      a: "No! A high financial amount alone is NOT high risk if the return is proceeding normally within SLA. Our risk engine is multi-factorial and fully transparent: it combines (1) Dynamic Ageing (>7 days = +35 pts), (2) Financial Exposure (>£20k = +25 pts), (3) Missing mandatory data or SAP incompletion flags (+20 pts), (4) Physical warehouse count vs billed quantity mismatch (+25 pts), and (5) Lack of an accountable case owner (+20 pts). Every risk score out of 100 cites the exact mathematical reasons, avoiding black-box guesswork."
    },
    {
      q: "5. What is the architecture and service boundary for SAP integration?",
      a: "The architecture follows a modern decoupled enterprise pattern: React Vite frontend → Node.js application API → SAP OData Adapter interface → SAP S/4HANA Gateway. In production, this would be deployed on SAP Business Technology Platform (SAP BTP) Cloud Foundry or Kyma runtime, authenticating via SAP Cloud Identity Services and connecting through BTP Destination Service to S/4HANA OData service API_CUSTOMER_RETURN_SRV. For today's demo, the adapter runs in transparent Demo Mode with seeded records, but provides health pings, timeout handling, retry logic, and simulated RFC failure injection."
    },
    {
      q: "6. How does the recommendation engine work? Is it an autonomous AI?",
      a: "It is an intelligent, deterministic, evidence-backed decision support engine designed for human-in-the-loop governance. It strictly follows a 7-step sequence: (1) Validate transaction, (2) Identify exception rule, (3) Gather evidence from timeline and physical inspection, (4) Formulate next business action, (5) Explain reasons with citations, (6) Allow the user to Accept, Edit, or Reject, and (7) Record user decision and audit feedback. In accordance with SAP audit compliance, high-risk actions NEVER post automatically—they always require human confirmation."
    },
    {
      q: "7. How do personas and role-based permissions function?",
      a: "We implement 4 distinct personas: (1) Returns Analyst (A. Sharma): inspects records, runs validations, adds collaboration comments, proposes recommendations; (2) Returns Manager (P. Sundaram): assigns owners, triages priority, approves operational workflow; (3) Finance Approver (R. Nair): reviews financial exposure, approves refunds > £10,000, and releases billing blocks; (4) Administrator: manages SLA thresholds, tests SAP RFC health, and resets data. Permissions are enforced in the API layer, rejecting unauthorized status transitions."
    },
    {
      q: "8. What business outcome and ROI does this deliver to SunGrid Renewables?",
      a: "SunGrid leadership identified that unresolved returns place 1% to 2% of annual revenue (£21M–£42M) at risk through premium expedited freight, technician overtime, obsolete inventory write-offs, and customer invoice disputes. By surfacing high-risk items, identifying root causes, and automating handoffs, the solution targets a 20–35% productivity improvement and a 10–20% reduction in ageing cycle time."
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: '#ffffff',
        border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <GraduationCap size={20} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#38bdf8' }}>
                KAAR Technologies Interview Defense Kit
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
              Candidate Interview Mastery & Defense Hub
            </h2>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', maxWidth: '750px', marginTop: '6px' }}>
              Master every technical, functional, and business aspect of this solution. Use this guide to rehearse your presentation and answer panel questions with 100% confidence.
            </p>
          </div>

          <button 
            onClick={onSelectReference}
            className="btn btn-primary"
            style={{ backgroundColor: '#0284c7' }}
          >
            <Sparkles size={14} />
            Inspect Reference INV-460008
          </button>
        </div>
      </div>

      {/* 3-Minute Demonstration Script */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Workflow size={18} color="#0284c7" />
            Recommended 3-Minute Demonstration Script
          </div>
          <span className="badge badge-neutral">Step-by-Step Flow</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#334155' }}>
          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
            <strong>Minute 1: Executive Context & Problem Statement</strong><br />
            "Good morning. Today I am presenting the Customer Return Exception Control solution for SunGrid Renewables—a £2.1B renewable enterprise running SAP S/4HANA SD. Although the technical implementation of Customer Returns (BKP) is complete, adoption is stalled because users navigate disconnected screens (VA01, VL01N, VF01) and rely on spreadsheets. Delays risk £21M–£42M (1-2% of revenue) in freight, write-offs, and disputes. On the Executive Dashboard, we immediately see £144.7k in active exposure and 3 overdue cases."
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
            <strong>Minute 2: Deep Dive into Reference Transaction INV-460008</strong><br />
            "Let us drill down to the assessment primary case: Document INV-460008 for Composite Panel CP-12 at Plant 1108 Storage Location SL11. Here we show how the app diagnoses the exact failure: 15 units were billed, but physical warehouse receipt logged only 10 units intact. Additionally, the VA01 return order was missing the mandatory Return Reason code, triggering an automatic billing block. The transparent risk engine scores this at 88/100."
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
            <strong>Minute 3: Resolution Workspace, Evidence-Backed AI, & Governance</strong><br />
            "In the Resolution Workspace, our intelligent recommendation engine synthesizes this evidence and advises adjusting the return to 10 units, assigning Reason 015, and releasing the credit memo for £15,666.70—protecting £7,833.30 from erroneous payout. As Returns Manager, I can reassign owners, review the illustrative credit draft, and approve the action, triggering our SAP OData boundary and recording an immutable audit entry."
          </div>
        </div>
      </div>

      {/* Top 8 Panel Questions & Crisp Answers */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <HelpCircle size={18} color="#0284c7" />
            Top Panel Questions & Model Answers (FAQ)
          </div>
          <span className="badge badge-neutral">Click question to toggle answer</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isOpen ? '#f0f9ff' : '#ffffff',
                    textAlign: 'left',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    color: isOpen ? '#0284c7' : '#0f172a'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isOpen && (
                  <div style={{
                    padding: '16px',
                    background: '#ffffff',
                    fontSize: '13px',
                    color: '#334155',
                    lineHeight: '1.6',
                    borderTop: '1px solid #e0f2fe'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
