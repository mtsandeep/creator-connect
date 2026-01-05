# 🚀 Influencer Marketplace: Project Brief

**Vision:** The Operating System for Influencer Marketing. A professional workspace where deals are settled with a "Digital Handshake," moving collaborations beyond the chaos of DMs into a structured, protected, and tax-compliant environment.

---

## 1. The Core Problem

* **Influencers:** Suffer from "Deal Decay" (losing track of requirements), "Payment Ghosting" (doing work but not getting paid), and "Amateur Perception" (using UPI/WhatsApp).
* **Promoters:** Struggle with "Audit Anxiety" (no record of barter/cash deals for taxes) and "Execution Risk" (influencers not posting after receiving products).
* **The Industry:** Operates on trust and messy DMs; lacks a standardized "System of Record" for Indian tax laws (Section 194-O and 194R).

---

## 2. Value Proposition (The "Safety First" Model)

| For Influencers | For Promoters (Brands/Agencies) |
| --- | --- |
| **WhatsApp Insurance:** A locked agreement prevents brands from changing scripts mid-way. | **Audit-Ready Ledger:** Every deal automatically creates a tax-compliant trail. |
| **Professional Edge:** Send a "Deal Link" instead of a UPI ID to look like a managed creator. | **Safe-Release Escrow:** Money stays safe; only released once the #Ad link is verified. |
| **ITR-Ready Vault:** Automatic generation of TDS certificates and income logs for the CA. | **Barter Protection:** Legal recording of product gifts to avoid tax penalties. |

---

## 3. Product Architecture & User Flows

### Flow A: Deal Negotiation (Sign-in Required)

1. **Start:** Promoter discovers influencer (browse / link-in-bio) and starts chat or sends a proposal.
2. **Negotiate:** Both parties discuss terms and finalize the proposal.
3. **Platform Fee (₹49):** Once terms are accepted:
   - Influencer pays **₹49** (mandatory for confirmed deals).
   - Promoter pays **₹49** (optional for non-escrow; mandatory for escrow).
4. **Payment Choice:** Deal can proceed via **Escrow** (platform-managed) or **Direct Payment** (outside platform) while still maintaining the record.

### Flow B: The Marketplace Discovery

1. **Discovery:** Promoters can browse influencers after completing the **₹1,000 verification**.
2. **Engagement:** Discussion starts in chat / proposals. Record-keeping and escrow fees apply when the deal is finalized and accepted.

---

## 4. Pricing & Transaction Tiers

*Strategic Logic: Nudge high-value/high-risk deals toward "Record-Only" to minimize platform liability.*

| Service Tier | Deal Value | Fee (Split or Single) | Goal |
| --- | --- | --- | --- |
| **Record-Only** | Any | **Influencer ₹49 (+ optional Promoter ₹49)** | Documentation & Conflict Protection. |
| **Nano Escrow** | Up to ₹5,000 | **₹149 + (Influencer ₹49 + Promoter ₹49)** | Escrow protection + platform fees. |
| **Micro Escrow** | ₹5,001 – ₹10,000 | **₹349 + (Influencer ₹49 + Promoter ₹49)** | Escrow protection + platform fees. |
| **Pro Escrow** | Above ₹10,000 | **10% + (Influencer ₹49 + Promoter ₹49)** | Escrow protection + platform fees. **The Deterrent:** Forces high-value users to handle payments directly. |

---

## 5. Key Features Overview

### A. The Deal Room (Digital Handshake)

* **Locked Agreement:** Once both parties agree, terms are frozen. Any changes require a mutual "Unlock."
* **Proof of Work (PoW):** Influencer submits the live URL; the system verifies the post's public status before releasing funds.
* **Access Control:** Users must be signed in to interact.

### B. Tax Compliance (Planned)

* **Tax Ledger:** Track 1% TDS (194-O) and Barter values (194R).
* **GST Handling (Required):** Always calculate **18% GST on all fees charged** (platform fees + escrow fees).
* **Document Vault:** Store invoices, proofs, and compliance documents for audit.
* **CA-Ready Export:** Monthly or yearly exports for filing.

---

## 6. Business & Operational Rules

* **Promoter Verification Credits:** **₹1,000** (required to browse and to prevent spam). Non-refundable credits usable for paying platform fees.
* **Credits Discount:** If a ₹49 fee is paid using credits, apply **20% discount** (₹49 → **₹39**).
* **Platform Fees:** Influencer pays **₹49** for all confirmed deals. Promoter platform fee is **optional** unless the deal uses escrow (then it is mandatory).
* **Escrow Fee Split:** Escrow fee (₹149/₹349/10%) can be split between both parties (decided during proposal discussion/approval).
* **Switching Logic:** Users can convert an Escrow deal to "Record-Only" at any time (escrow fees stop applying, record keeping remains).
* **Digital Notary Role:** The platform certifies the *existence* of the agreement and the *post*, not the creative quality of the work.
* **Safe Harbour:** Funds are held in regulated payment gateway accounts (Razorpay) until settlement.

---

## 7. Tech Stack

* **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui.
* **Backend:** Firebase (Auth, Firestore, Storage, Functions).
* **Payments:** Razorpay (Route/Split payments).
* **Auth:** Google OAuth (Passwordless).

---

## 8. Implementation Roadmap

* **Phase 1-7 (Core):** Auth, Profiles, Search, Chat, Proposals (COMPLETED).
* **Phase 8:** **Record-Only:** Record keeping payments (₹49 each side) + invoice generation.
* **Phase 9:** **Promoter Verification Credits:** ₹1,000 verification payment + credit wallet + ₹39 discounted fee via credits.
* **Phase 10:** **Escrow:** Razorpay integration (₹149/₹349/10%) + mandatory record-keeping fees.
* **Phase 11:** **Tax Compliance:** TDS/GST documents + CA-ready exports.