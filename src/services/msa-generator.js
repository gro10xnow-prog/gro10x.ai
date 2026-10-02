/**
 * src/services/msa-generator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Master Service Agreement (MSA) & Non-Disclosure Agreement (NDA) Generator
 * Standardized B2B Legal Protection Engine for Engine 2 AI Solution Engagements
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const { findProject } = require('./post-delivery');

// In-memory cache for MSA agreements
const memoryMSAs = new Map();

/**
 * Generates an Enterprise Master Service Agreement with NDA
 */
async function generateProjectMSA(projectId, options = {}) {
  let project = await findProject(projectId);
  if (!project) {
    // Resilient fallback for proposal preview & client onboarding pipelines
    project = {
      id: projectId,
      name: options.projectName || 'Enterprise AI Solution Sprint',
      client: options.companyName || options.clientName || 'Partner Client Organization',
      clientName: options.clientName || options.companyName || 'Partner Client Organization',
      company: options.companyName || options.clientName || 'Partner Client Organization',
      description: options.serviceScope || 'Enterprise AI Solution Engineering, Automated Workflows, and Custom Software Delivery.'
    };
  }

  const clientName = options.clientName || project.client?.name || project.clientName || 'Valued Client Partner';
  const companyName = options.companyName || options.clientName || project.client?.company || project.company || clientName;
  const signatoryName = options.signatoryName || options.clientSignatory || 'Authorized Corporate Signatory';
  const signatoryRole = options.signatoryRole || 'Managing Director / Executive';
  const effectiveDate = options.effectiveDate || new Date().toISOString().split('T')[0];

  const msaId = `MSA-2026-${String(projectId).replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase() || '001'}`;

  const serviceScope = options.serviceScope || project.description || 'Enterprise AI Solution Engineering, Automated Workflows, and Custom Software Delivery.';

  // Construct raw text for cryptographic fingerprinting
  const legalCorpus = `${msaId}|GRO10X-ENGINE2|${companyName}|${effectiveDate}|${serviceScope}`;
  const verificationHash = crypto.createHash('sha256').update(legalCorpus).digest('hex').toUpperCase().slice(0, 32);

  const msaDocument = {
    msaId,
    projectId,
    status: 'ACTIVE_EXECUTED',
    effectiveDate,
    jurisdiction: 'Dhaka, Bangladesh (UNCITRAL Arbitration Rules Recognized)',
    governingLaw: 'Laws of the People\'s Republic of Bangladesh',
    verificationHash: `GRO10X-SEC-${verificationHash}`,
    parties: {
      provider: {
        legalName: 'GRO10X Business Limited',
        brandName: 'Gro10x.ai',
        registrationNo: 'REG-BD-2025-G10X',
        headquarters: 'House 14, Road 7, Sector 3, Uttara, Dhaka 1230, Bangladesh',
        signatory: 'Tanvir Ahmed',
        title: 'Managing Director & Principal Architect',
        email: 'tanvir@gro10x.ai'
      },
      client: {
        companyName,
        authorizedSignatory: signatoryName,
        designation: signatoryRole,
        email: options.clientEmail || project.client?.email || 'poc@client.corp',
        address: options.clientAddress || project.client?.address || 'Client Corporate Headquarters'
      }
    },
    clauses: [
      {
        section: '1. Engagement & Statements of Work',
        title: 'Scope of AI Engineering Engagement',
        content: `GRO10X agrees to provide high-velocity AI engineering, intelligent automation, and custom algorithmic deliverables as specified in Statement of Work (SOW) records attached to project ${projectId}. Deliverables adhere to mutually approved Definition of Done (DoD) benchmarks.`
      },
      {
        section: '2. Intellectual Property Assignment',
        title: 'Intellectual Property Assignment & Irrevocable Transfer of Ownership',
        content: 'Upon receipt of final invoice settlement, GRO10X irrevocably transfers and assigns 100% of all intellectual property, bespoke source code, fine-tuned model weights, database schemas, and documentation produced under this agreement to Client. GRO10X retains zero residual claim or proprietary lock-in on custom deliverables.'
      },
      {
        section: '3. Mutual Non-Disclosure & Data Confidentiality',
        title: 'Mutual Non-Disclosure & Confidentiality of Proprietary Assets & Client Data',
        content: 'Both parties agree to protect all confidential proprietary information, including proprietary training datasets, production API keys, algorithms, customer records, and trade secrets, for a duration of not less than five (5) consecutive years from execution. Client training data shall never be utilized to train public foundation models.'
      },
      {
        section: '4. 30-Day Bug-Fix Warranty & Maintenance SLA',
        title: '30-Day Bug-Fix Warranty & Zero-Cost Maintenance SLA',
        content: 'GRO10X guarantees a 30-calendar-day warranty commencing on the date of formal deliverable acceptance. Critical severity regressions (P0) will be responded to within 4 business hours; standard regressions (P1) within 24 business hours at zero additional cost to Client.'
      },
      {
        section: '5. Multi-Rail Settlement & Commercial Terms',
        title: 'Multi-Rail Settlement & Invoicing Standards',
        content: 'Invoicing follows milestone sprint completion. Client agrees to settle invoices via institutional bank wire transfer (BRAC Bank PLC) or authorized corporate rails within five (5) business days of issuance. All payments conform to applicable statutory 5% VAT withholding.'
      },
      {
        section: '6. Limitation of Liability',
        title: 'Limitation of Liability & Standard Enterprise Cap',
        content: 'Except for breaches of Section 3 (Confidentiality) or Section 2 (IP Assignment), neither party shall be liable for indirect, punitive, or consequential damages. Maximum aggregate liability shall not exceed the total fees paid under the applicable SOW.'
      },
      {
        section: '7. Governing Law & Dispute Escalation',
        title: 'Governing Law & Dispute Escalation Protocol',
        content: 'This Agreement is governed by the laws of Bangladesh. Any dispute arising out of or in connection with this contract shall be submitted to the dispute resolution mechanism with warranty pause protection, followed if unresolved by arbitration under the Arbitration Act 2001 of Bangladesh in Dhaka.'
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      engineVersion: 'Engine 2.0 (B2B AI Agency Scale)',
      viewUrl: `/msa-view.html?projectId=${projectId}&msaId=${msaId}`
    }
  };

  memoryMSAs.set(projectId, msaDocument);
  return msaDocument;
}

/**
 * Retrieves or generates an MSA for a project
 */
async function getProjectMSA(projectId) {
  if (memoryMSAs.has(projectId)) {
    return memoryMSAs.get(projectId);
  }
  return await generateProjectMSA(projectId);
}

module.exports = {
  generateProjectMSA,
  getProjectMSA,
  memoryMSAs
};
