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

### Flow A: The "Lure & Lock" (Guest-First Entry)

1. **Direct Entry:** Influencer/Promoter sends a unique **"Magic Link"** to an external party.
2. **Guest Discussion:** The recipient enters the **Deal Room** immediately. They can chat, negotiate, and share drafts **without signing up**.
3. **The Free Hook:** Upon deal completion, the platform generates a **Professional Invoice** for free.
4. **The Paywall (Verification):** To "Verify" the deal (locking it as a legal record) or to access **Tax Compliance Vaults**, users must sign up and pay the **₹49 Verification Fee**.

### Flow B: The Marketplace Discovery

1. **Discovery:** Promoters with an active **Yearly Pass** find influencers via advanced filters.
2. **Engagement:** Discussion starts in the Deal Room. Fees are only applied once the deal is finalized.

---

## 4. Pricing & Transaction Tiers

*Strategic Logic: Nudge high-value/high-risk deals toward "Record-Only" to minimize platform liability.*

| Service Tier | Deal Value | Fee (Split or Single) | Goal |
| --- | --- | --- | --- |
| **Record-Only** | Any | **₹49 + ₹49** | Documentation & Conflict Protection. |
| **Nano Escrow** | Up to ₹5,000 | **₹149 (Flat)** | Security for small creators. |
| **Micro Escrow** | ₹5,001 – ₹10,000 | **₹349 (Flat)** | Mid-tier pro-protection. |
| **Macro Escrow** | Above ₹10,000 | **10%** | **The Deterrent:** Forces high-value users to handle payments directly. |

---

## 5. Key Features Overview

### A. The Deal Room (Digital Handshake)

* **Locked Agreement:** Once both parties agree, terms are frozen. Any changes require a mutual "Unlock."
* **Proof of Work (PoW):** Influencer submits the live URL; the system verifies the post's public status before releasing funds.
* **Ephemeral Access:** Guest links expire **14 days** post-deal. Users must "Claim" the record via signup to keep it permanently.

### B. The Compliance Engine

* **Tax Ledger:** Tracks 1% TDS (194-O) and Barter values (194R).
* **GST Handling:** Automatic calculation and invoicing for GST-registered creators.
* **CA-Ready Export:** Monthly or Yearly "Compliance Packs" for tax filing.

---

## 6. Business & Operational Rules

* **Promoter Pass:** ₹1,000/year (Required to browse discovery; includes 10 Nano credits).
* **Switching Logic:** Users can convert an Escrow deal to "Record-Only" at any time to save on fees.
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
* **Phase 8:** **Magic Link & Guest Chat:** Enable discussion without mandatory signup.
* **Phase 9:** **The Verification Gate:** Signup logic to unlock ₹49 Safety/Compliance PDFs.
* **Phase 10:** **The Safety Shield:** Escrow integration with Razorpay (₹149/₹349/10% gates).
* **Phase 11:** **The Tax Vault:** Consolidated CA-ready reporting dashboard.