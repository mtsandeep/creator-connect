# Payment Flow

## Canonical Rules

- **Sign-in required:** All interactions and deal actions require sign-in.
- **Record-Only stays as the name** (do not rename).
- **Platform fee (₹49):**
  - **Creator (Influencer) platform fee is mandatory** for confirmed deals.
  - **Promoter platform fee is optional** for non-escrow deals, and **mandatory for escrow**.
- **Escrow is optional:** if chosen, escrow fees apply on top of the platform fees.
- **Escrow fee split:** escrow fee is decided during proposal discussion/approval and can be split between both parties.
- **Promoter verification:** Promoters pay **₹1,000** to prevent spam and unlock platform access.
  - This is **non-refundable**.
  - This becomes **credits** that can be used to pay platform fees.
  - If a **₹49** fee is paid using credits, apply **20% discount** → charge **₹39**.
  - Credits expire in **1 year**.
- **GST is required:** Always calculate **18% GST on all fees charged** (platform fees + escrow fees).

---

## Deal Payment Options

### Option A: Direct Payment + Record-Only

This is for deals where payment happens outside the platform (UPI/bank transfer/barter) but the collaboration is still recorded for audit/tax.

1. Promoter creates proposal and finalizes amount.
2. Influencer accepts finalized terms.
3. Platform fees:
   - Creator: ₹49
   - Promoter: optional ₹49 (or ₹39 if paid using verification credits)
4. Deal proceeds with off-platform payment.
5. Proofs and documents are collected/generated as applicable.

### Option B: Escrow + Record Keeping

1. Promoter creates proposal and finalizes amount.
2. Influencer accepts finalized terms.
3. Platform fees:
   - Creator: ₹49
   - Promoter: ₹49 (or ₹39 via credits)
4. Promoter pays into escrow:
   - Deal Amount
   - Escrow fee (based on deal size)
   - Escrow fee split is decided during proposal discussion/approval
   - GST on all fees charged (platform fees + escrow fees)
5. Platform holds funds until completion milestones and then releases according to the escrow rules.

---

## Escrow Fee Tiers (Escrow Fee)

- Nano Deal (≤₹5,000): **₹149**
- Micro Deal (₹5,001–₹10,000): **₹349**
- Pro Deal (>₹10,000): **10%**

Note: These are **in addition** to the platform fees (Creator ₹49 + Promoter ₹49 for escrow).

---

## Supporting Product Requirements

- Influencer pays their platform fee **after receiving money from the deal** (implementation detail; enforce via status transitions).
- If promoter changes pricing after influencer approval, proposal returns to pending approval and must be re-approved.
- Auto archive proposal if deal not closed in 7 days from proposal creation. Email/notification sent to ask brands and influencers to store forever by paying ₹49. Show archived proposals and show last x messages and masked details after archiving.
- Self checkout (Creator/Promoter): allow user to create a proposal/record for themselves without the other party. Charged at ₹49.

### 1. The Role-Based Data Checklist

This is the data you need to collect and store in your database for each user type.

| Data Point | **For Creator (Influencer)** | **For Brand (Promoter/Agency)** | **Why?** |
| --- | --- | --- | --- |
| **Legal Name** | Name as per PAN/Bank. | Registered Company/Entity Name. | For valid GST/Tax Invoices. |
| **PAN Details** | Personal PAN. | Business PAN. | To calculate 1% vs 20% TDS. |
| **GSTIN** | Optional (Needed if >₹20L/yr). | Highly Recommended. | Brand needs this for Tax Credit. |
| **Billing Address** | Primary Residence. | Registered Office Address. | Legal requirement for all Invoices. |
| **Bank Account** | Mandatory for Payouts. | Optional (Usually pay via UPI/Card). | For Razorpay Route settlements. |
| **Aadhar KYC** | Mandatory for Escrow. | Mandatory for Business Entity. | Razorpay's KYC requirement. |

---

### 2. Feature & Responsibility Flow

This defines who is responsible for what during the lifecycle of a collaboration.

| Feature | **Creator's Perspective** | **Brand's Perspective** | **Platform/Razorpay Role** |
| --- | --- | --- | --- |
| **Onboarding** | Completes KYC to receive funds. | Completes KYC to pay/manage funds. | **Platform** triggers KYC via API. |
| **Workspace** | Negotiates & uploads drafts. | Approves drafts & verifies post. | **Platform** logs the "Handshake". |
| **₹49 Plan** | Gets a "Verified Record" PDF. | Gets a "Legal Expense" PDF. | **Platform** generates audit docs. |
| **₹149 Plan** | Guaranteed payment "On Hold". | Funds held safely until live. | **Razorpay Route** holds money. |
| **TDS (194-O)** | Sees 1% deducted in dashboard. | Sees 1% tax paid on their behalf. | **Platform** files monthly with Govt. |
| **194R (Barter)** | Logs product value received. | Logs product value gifted. | **Platform** generates 194R Ledger. |

---

### 3. "Record-Only" vs. "Escrow" Development Logic

Record-Only is the platform fee plan (Creator pays ₹49; Promoter platform fee is optional unless escrow).

#### **A. Record-Only (₹49 per side) — "The Digital Notary"**

* **Best for:** Barter deals or when the Brand has already paid the Creator via UPI.
* **Platform Role:** You don't touch the deal money. You only charge platform fees.
* **Checklist for Dev:**
* [ ] Collect PAN & Address from both.
* [ ] Ask: "Cash or Barter?" and "Total Value?"
* [ ] Generate **Invoice** + **194R Barter Certificate** (if barter).
* [ ] Store the post screenshot as "Proof of Work."

#### **B. Payment Escrow (₹149+) — "The Financial Safe"**

* **Best for:** High-value cash deals where trust is low.
* **Platform Role:** You collect the deal money + fees.
* **Checklist for Dev:**
* [ ] **Razorpay Linked Account:** Create a "Linked Account" for the Creator.
* [ ] **The Split:** Calculate `Deal Amount - (Platform Fee + 1% TDS)`.
* [ ] **The Hold:** Call Route API with `on_hold: true`.
* [ ] **The Release:** Call `release_hold` API only after post-verification.

---

### 4. Technical Checklist for Integration

* **Razorpay Linked Account:** Use the `Create Account` API for the Creator role.
* **GST Calculation:** Always calculate 18% GST on all fees charged (platform fees + escrow fees).
* **TDS Logic:**
* For Escrow: You deduct and pay the TDS.
* For Record-Only: You simply print a "TDS Advice" on the invoice for the Brand to handle.

* **File Storage:** You must store the **PDF Invoices** and **Post Proofs** for at least 8 years (Income Tax requirement).

### 5. Summary Table for App Logic

| Transaction Type | Fee | Creator Action | Brand Action | Platform Status |
| --- | --- | --- | --- | --- |
| **Barter Collab** | Creator ₹49 (+ optional Promoter ₹49) | Accept product | Upload shipping proof | **Record Keeper** |
| **Direct Cash** | Creator ₹49 (+ optional Promoter ₹49) | Confirm Receipt | Upload payment proof | **Record Keeper** |
| **Escrow Cash** | (Creator ₹49 + Promoter ₹49) + (₹149 / ₹349 / 10%) | Verify & Post | Pay into Escrow | **Financial Operator** |

---

What documents gets shared with the other party?

---

### 1. What the Creator sees about the Promoter (Brand)

The Creator needs this data to issue a professional invoice and to know who is responsible for their payment.

| Detail | Shared? | Why? |
| --- | --- | --- |
| **Legal Entity Name** | **Yes** | Must appear on the "Bill To" section of the Creator's invoice. |
| **GST Number** | **Yes** | The Creator needs this to file their GST returns (GSTR-1) so the Brand can get tax credit. |
| **Billing Address** | **Yes** | Standard requirement for any legal tax invoice. |
| **PAN Card** | **No** | Usually not required if GST is provided. GSTIN contains the PAN anyway (digits 3-12). |
| **TAN Number** | **Optional** | Only if the Brand is deducting TDS manually (not via your Escrow). |

---

### 2. What the Promoter (Brand) sees about the Creator

The Brand needs this data to justify their marketing spend to the Income Tax department and to fulfill TDS requirements (194-O / 194R).

| Detail | Shared? | Why? |
| --- | --- | --- |
| **Legal Name** | **Yes** | Must match the bank account and the "Service Provider" name on the invoice. |
| **PAN Number** | **Yes** | **Mandatory.** The Brand cannot deposit TDS without the Creator's PAN. Without PAN, the Brand is legally forced to deduct **20% TDS** instead of 1% or 10%. |
| **GST Number** | **Yes** | If the Creator is registered, the Brand needs this to claim 18% Input Tax Credit. |
| **Billing Address** | **Yes** | Required for the "Place of Supply" calculation in GST (IGST vs CGST/SGST). |
| **Aadhar Number** | **Strict No** | **Never share Aadhar.** This is sensitive PII. Only your platform and Razorpay should see this for KYC. |

---

### 3. How to handle this "Privacy vs. Compliance"

You should not just "show" this data on a profile page. Instead, handle it through **Document Generation**:

1. **The "Masked" Profile:** On the public profile, only show the Stage Name (e.g., @TechBurner).
2. **The Workspace "Lock":** Once the deal is "Locked" (₹49 paid), the platform automatically exchanges the legal details *only* within the generated Invoice PDF.
3. **The PDF Pack:**
* The **Creator** gets an Invoice where the **Brand's GST/Address** is pre-filled.
* The **Brand** gets a TDS Advice/Ledger where the **Creator's PAN** is listed.



### 4. Special Case: TAN (Tax Deduction Account Number)

* **For Escrow:** The Brand **does not need** to share their TAN with the Creator because *your platform* is the one deducting the tax and issuing the certificate.
* **For Record-Only:** If the Brand is paying the Creator directly, the Brand might need to provide their TAN to the Creator so the Creator can see the TDS credit in their Form 26AS.

### **Summary Checklist for your Devs:**

* **Store** all PAN/GST/TAN details in a secure, encrypted `UserProfiles` table.
* **Share** only on a "Need-to-know" basis via the **generated Invoice/Ledger PDFs**.
* **Display** a clear notice to Creators: *"To ensure you are taxed at 1% instead of 20%, your PAN will be shared with the Brand for TDS filing purposes."*