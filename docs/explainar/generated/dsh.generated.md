# DSH - بيانات مولدة

## مسارات OpenAPI
| method | path | summary |
| --- | --- | --- |
| GET | /admin/audit/logs | Search audit logs by entity/action/date |
| GET | /admin/decisions | List governance decisions and statuses. |
| GET | /admin/dls/orders | List platform orders with filters |
| GET | /admin/dls/orders/{order_id} | Get order details with audit trail |
| GET | /admin/feature-flags | List feature flags with environment and scope. |
| POST | /admin/feature-flags/{flag}/toggle | Toggle a feature flag on/off for a scope. |
| POST | /admin/fin/settlements | Create vendor settlement batch (dual-sign required) |
| POST | /admin/fin/settlements/{batch_id}/approve | Approve settlement batch (dual-sign) |
| GET | /admin/metrics | Admin overview metrics |
| GET | /admin/partners | List partners with filters |
| POST | /admin/partners | Create partner account |
| GET | /admin/partners/{partner_id} | Load partner details including policies/zones. |
| PATCH | /admin/partners/{partner_id} | Update partner profile and policies |
| POST | /admin/partners/{partner_id}/approve | Approve partner after KYC review. |
| POST | /admin/partners/{partner_id}/reject | Reject partner application with reason. |
| GET | /admin/runtime/vars | List runtime variables with scope precedence. |
| PATCH | /admin/runtime/vars | Update runtime VAR_* with audit and previews |
| PUT | /admin/runtime/vars/{key} | Create or update a runtime variable. |
| DELETE | /admin/runtime/vars/{key} | Delete a runtime variable. |
| POST | /admin/security/rotate-keys | Rotate keys; enforce vault storage; record audit |
| GET | /admin/users | List users with roles and status. |
| POST | /admin/users/{user_id}/roles | Assign or update user roles with step-up. |
| GET | /api/bi/alerts |  |
| POST | /api/bi/alerts |  |
| PATCH | /api/bi/alerts/{id} |  |
| GET | /api/bi/dashboards |  |
| GET | /api/bi/dashboards/{id} |  |
| POST | /api/bi/exports |  |
| GET | /api/bi/exports/{job_id} |  |
| GET | /api/bi/metrics |  |
| GET | /api/bi/queries |  |
| POST | /api/bi/queries/run |  |
| GET | /api/bi/reports |  |
| POST | /api/bi/reports |  |
| GET | /api/crm/customers | Search customers, masked PII, cursor pagination. |
| GET | /api/crm/customers/{customer_id} | Customer profile with masking and role-based reveal. |
| POST | /api/crm/customers/{customer_id}/unmask-request | Create controlled unmask request; requires Step-Up and auditing. |
| POST | /api/crm/exports/masked | Start masked export; Privacy-Export enforced. |
| POST | /api/crm/exports/unmasked/dry-run | Dry-run only unmasked export; blocked in Sensitive Mode. |
| POST | /api/crm/inbound/messages | Inbound provider messages; signature + anti-replay enforced. |
| GET | /api/crm/reports | List available CRM reports. |
| POST | /api/crm/reports | Generate a report; background job id returned. |
| GET | /api/crm/tickets | List tickets with cursor pagination; masked PII. |
| GET | /api/crm/tickets/{ticket_id} | Get ticket details and timeline. |
| POST | /api/crm/tickets/{ticket_id}/assign | Assign ticket to agent; step-up may be required. |
| POST | /api/crm/tickets/{ticket_id}/messages | Post a masked reply; AES-GCM field encryption; audit log. |
| POST | /api/crm/tickets/{ticket_id}/read-ack | Acknowledge messages as read. |
| PATCH | /api/crm/tickets/{ticket_id}/tags | Update tags. |
| POST | /api/crm/unmask/{request_id}/approve | Approve unmask after dual control. |
| GET | /api/dls/cancel-reasons | List allowed cancel reasons. |
| POST | /api/dls/captain/availability | Set on-duty/off-duty and service zones. |
| GET | /api/dls/captain/earnings | Captain earnings summary. |
| POST | /api/dls/captain/location | Periodic captain location heartbeat. |
| GET | /api/dls/captain/orders | List assigned/available orders for captain (cursor/limit). |
| GET | /api/dls/captain/orders/{order_id} | Get order details and current state. |
| POST | /api/dls/captain/orders/{order_id}/accept | Accept an available order. |
| POST | /api/dls/captain/orders/{order_id}/arrived-customer | Mark arrived at customer location. |
| POST | /api/dls/captain/orders/{order_id}/arrived-store | Mark arrived at store. |
| GET | /api/dls/captain/orders/{order_id}/chat/messages | Chat history with masking and pagination. |
| POST | /api/dls/captain/orders/{order_id}/chat/messages | Send chat message with phone/links masking. |
| POST | /api/dls/captain/orders/{order_id}/chat/read-ack | Mark chat messages as read. |
| POST | /api/dls/captain/orders/{order_id}/delivered | Close order with PoD code when required. |
| POST | /api/dls/captain/orders/{order_id}/picked-up | Confirm items picked up. |
| POST | /api/dls/captain/orders/{order_id}/reject | Reject an offered order. |
| GET | /api/dls/captain/orders/{order_id}/timeline | View order event timeline. |
| POST | /api/dls/inbound/messages | Inbound provider messages webhook. |
| GET | /api/dls/orders | List user orders with pagination. |
| POST | /api/dls/orders | Create order according to channel and payment. |
| GET | /api/dls/orders/{order_id} | Get order details including state history. |
| PATCH | /api/dls/orders/{order_id} | Confirm Dark-Store slot or update order minor fields. |
| POST | /api/dls/orders/{order_id}/cancel | Cancel order within free window if allowed. |
| GET | /api/dls/orders/{order_id}/chat/messages | List chat messages with cursor pagination. |
| POST | /api/dls/orders/{order_id}/chat/messages | Send chat message with masking and field encryption. |
| POST | /api/dls/orders/{order_id}/chat/read-ack | Acknowledge chat messages as read. |
| GET | /api/dls/orders/{order_id}/eta | Get ETA independent of tracking UI. |
| POST | /api/dls/orders/{order_id}/feedback | Submit feedback for order/store/captain. |
| GET | /api/dls/orders/{order_id}/notes | List order notes with pagination. |
| POST | /api/dls/orders/{order_id}/notes | Add short encrypted note to order timeline. |
| POST | /api/dls/orders/{order_id}/pickup/close | Close pickup using 6-digit code. |
| POST | /api/dls/orders/{order_id}/pod/verify | Verify proof of delivery for platform channel. |
| GET | /api/dls/orders/{order_id}/receipt | Get final receipt for the order. |
| POST | /api/dls/orders/{order_id}/reorder | Reorder quickly from a previous order. |
| GET | /api/dls/orders/{order_id}/timeline | Get order timeline with timestamps and notes. |
| GET | /api/dls/orders/{order_id}/tracking | Get delivery tracking info. |
| POST | /api/dls/partner/inbound/status | Inbound status webhook from external partner middleware. |
| GET | /api/dls/partner/orders | List partner orders with cursor/limit and filters. |
| GET | /api/dls/partner/orders/{order_id} | Get order details including items and timeline pointer. |
| POST | /api/dls/partner/orders/{order_id}/accept | Accept order for fulfillment (partner or pickup modes). |
| GET | /api/dls/partner/orders/{order_id}/chat/messages | List chat messages with pagination. |
| POST | /api/dls/partner/orders/{order_id}/chat/messages | Send chat message with masking and AES-GCM field encryption. |
| POST | /api/dls/partner/orders/{order_id}/chat/read-ack | Acknowledge chat read status. |
| POST | /api/dls/partner/orders/{order_id}/handoff | Confirm handoff to platform captain with PoD token scan if applicable. |
| GET | /api/dls/partner/orders/{order_id}/notes | List order notes with pagination. |
| POST | /api/dls/partner/orders/{order_id}/notes | Create encrypted short note visible to staff and user as policy allows. |
| POST | /api/dls/partner/orders/{order_id}/pickup/close | Close pickup by verifying 6-digit code from customer. |
| POST | /api/dls/partner/orders/{order_id}/ready | Mark order as ready for pickup/hand-off. |
| POST | /api/dls/partner/orders/{order_id}/receipt/issue | Issue final receipt payload after fulfillment review. |
| POST | /api/dls/partner/orders/{order_id}/reject | Reject order with a standard reason catalog. |
| GET | /api/dls/partner/orders/{order_id}/timeline | View order timeline for auditing. |
| POST | /api/dls/partners/intake | Start partner intake case and create a provisional partner record. |
| POST | /api/dls/partners/me/inventory/adjust | Adjust stock/count for specific SKUs (optional profile). |
| GET | /api/dls/partners/me/policies | Get active delivery modes/platform-partner-pickup policy toggles. |
| PATCH | /api/dls/partners/me/policies | Update partner policy toggles subject to admin approval gates. |
| GET | /api/dls/partners/me/slots | List partner-defined pickup/delivery time slots for dark-store mode. |
| POST | /api/dls/partners/me/slots | Create or update a time slot definition. |
| DELETE | /api/dls/partners/me/slots/{slot_id} | Delete an existing time slot definition. |
| GET | /api/dls/partners/me/zones | Get coverage zones of the store. |
| PATCH | /api/dls/partners/me/zones | Update coverage zones subject to review/approval if flagged. |
| GET | /api/dls/partners/pending | List pending partner intakes with pagination. |
| GET | /api/dls/partners/{partner_id} | Get partner details. |
| POST | /api/dls/partners/{partner_id}/approve | Approve partner; requires step-up; writes immutable audit. |
| PUT | /api/dls/partners/{partner_id}/bank | Set payout bank details with step-up verification. |
| POST | /api/dls/partners/{partner_id}/documents | Upload KYC/permit documents with AV scan and immutable audit trail. |
| POST | /api/dls/partners/{partner_id}/identity | Submit legal name, CRN, tax id, owner info. Sensitive fields masked on export. |
| POST | /api/dls/partners/{partner_id}/notifications | Dispatch SMS/WhatsApp notification to partner. |
| GET | /api/dls/partners/{partner_id}/policies | Get partner policies for platform/partner/pickup modes. |
| POST | /api/dls/partners/{partner_id}/reject | Reject with reason; ticket remains for follow up. |
| POST | /api/dls/partners/{partner_id}/stores | Create a store under the partner. |
| POST | /api/dls/partners/{partner_id}/submit-review | Submit partner onboarding package for Ops review. |
| POST | /api/dls/partners/{partner_id}/users/invite | Invite partner manager to Partner App. |
| GET | /api/dls/partners/{partner_id}/zones | Get partner coverage zones. |
| POST | /api/dls/quotes | Create preliminary quote or slot for Dark-Store. |
| GET | /api/dls/slots | List general Dark-Store delivery/pickup slots. |
| GET | /api/dls/stores/{store_id} | Get store details. |
| PATCH | /api/dls/stores/{store_id} | Update store profile, hours, contacts. |
| PUT | /api/dls/stores/{store_id}/commission | Set sales commission policy; write to audit logs. |
| PUT | /api/dls/stores/{store_id}/delivery-modes | Enable platform/partner/pickup modes as agreed with the partner. |
| PUT | /api/dls/stores/{store_id}/zones | Define delivery coverage zones for the store. |
| POST | /api/fin/settlements/requests | Create payout request (dual-sign later) |
| GET | /api/fin/settlements/{settlement_id} | Settlement details |
| GET | /api/fin/settlements?store_id={store_id} | Settlement batches for store |
| GET | /api/fleet/captains/{captain_id} | Load captain profile for review |
| POST | /api/fleet/captains/{captain_id}/approve | Approve captain after KYC and vehicle check |
| POST | /api/fleet/captains/{captain_id}/force-offline | Force captain offline with reason and TTL |
| POST | /api/fleet/captains/{captain_id}/reject | Reject captain with reason |
| POST | /api/fleet/dispatch/orders/{order_id}/assign | Assign order to captain manually |
| POST | /api/fleet/dispatch/orders/{order_id}/reassign | Reassign order to another captain |
| GET | /api/fleet/dispatch/unassigned?cursor={cursor}&limit={limit} | List unassigned delivery orders |
| POST | /api/fleet/inbound/location | Inbound location webhook with HMAC |
| POST | /api/fleet/incidents | Log operational or safety incident |
| GET | /api/fleet/incidents?cursor={cursor}&limit={limit}&status={status} | List incidents with filters |
| GET | /api/fleet/live/locations?city={city}&radius_km={radius_km} | Query live captain locations |
| POST | /api/fleet/shifts/{shift_id}/assign | Assign captain(s) to shift |
| GET | /api/fleet/shifts?cursor={cursor}&limit={limit} | List active and planned shifts |
| POST | /api/hr/attendance/{employee_id}/adjust | Adjust attendance record with audit. |
| GET | /api/hr/attendance?from={from}&to={to} | Attendance window summary. |
| GET | /api/hr/benefits | List benefits. |
| PATCH | /api/hr/benefits/{benefit_id} | Update benefit. |
| GET | /api/hr/contracts | List contracts. |
| POST | /api/hr/contracts | Create new contract. |
| PATCH | /api/hr/contracts/{contract_id} | Update contract. |
| GET | /api/hr/employees | List employees with pagination. |
| POST | /api/hr/employees | Create employee. |
| GET | /api/hr/employees/{employee_id} | Get employee profile. |
| PATCH | /api/hr/employees/{employee_id} | Update employee. |
| POST | /api/hr/employees/{employee_id}/deactivate | Deactivate employee (requires Step-Up). |
| GET | /api/hr/holidays | List holidays calendar. |
| POST | /api/hr/holidays | Create holiday. |
| POST | /api/hr/inbound/payroll-status | Inbound payroll processing status. |
| POST | /api/hr/incentives/configure | Configure incentive pool and rules. |
| GET | /api/hr/leaves | List leave requests. |
| POST | /api/hr/leaves/{leave_id}/approve | Approve leave. |
| POST | /api/hr/leaves/{leave_id}/reject | Reject leave. |
| GET | /api/hr/metrics | Load HR KPIs summary. |
| POST | /api/hr/payroll/build | Build payroll draft for a period. |
| GET | /api/hr/payroll/runs | List payroll runs. |
| POST | /api/hr/payroll/runs/{run_id}/approve | Approve payroll run. |
| POST | /api/hr/payroll/runs/{run_id}/export | Export masked payroll for bank file. |
| POST | /api/hr/payroll/runs/{run_id}/lock | Lock payroll run (no further edits). |
| POST | /api/hr/payroll/runs/{run_id}/payouts/queue | Queue bank payouts batch with dual-sign policy. |
| GET | /api/hr/shifts | List shifts. |
| POST | /api/hr/shifts/{shift_id}/assign | Assign shift to employee. |
| GET | /api/hr/timesheets | List timesheets. |
| POST | /api/hr/timesheets/{timesheet_id}/approve | Approve timesheet. |
| GET | /api/mkt/campaigns |  |
| POST | /api/mkt/campaigns |  |
| GET | /api/mkt/campaigns/{campaign_id} |  |
| PATCH | /api/mkt/campaigns/{campaign_id} |  |
| POST | /api/mkt/campaigns/{campaign_id}/send |  |
| POST | /api/mkt/channels/sms/test |  |
| POST | /api/mkt/channels/whatsapp/test |  |
| POST | /api/mkt/consent/opt-in |  |
| POST | /api/mkt/consent/opt-out |  |
| GET | /api/mkt/subscribers |  |
| POST | /api/mkt/subscribers/import |  |
| POST | /api/mkt/webhooks/inbound/sms |  |
| POST | /api/mkt/webhooks/inbound/whatsapp |  |
| GET | /api/ops/dls/audit/logs |  |
| GET | /api/ops/dls/disputes |  |
| POST | /api/ops/dls/inbound/messages |  |
| GET | /api/ops/dls/orders |  |
| GET | /api/ops/dls/orders/{order_id} |  |
| POST | /api/ops/dls/orders/{order_id}/dispatch/assign |  |
| GET | /api/ops/dls/partners/onboarding |  |
| POST | /api/ops/dls/partners/{partner_id}/notifications |  |
| GET | /api/ops/dls/sla/breaches |  |
| PATCH | /api/ops/dls/slots/{slot_id} |  |
| POST | /api/partner/inbound/messages | Inbound channel webhook with HMAC |
| POST | /api/partner/media/signed-url | Create signed URL for media upload |
| GET | /api/partner/overview | Overview KPIs and alerts |
| GET | /api/partner/stores | List partner stores with pagination |
| GET | /api/partner/stores/{store_id} | Get store details |
| PATCH | /api/partner/stores/{store_id} | Update store profile and settings |
| POST | /api/partner/stores/{store_id}/availability | Open/close store |
| GET | /api/partner/stores/{store_id}/chat/threads | List chat threads (masked) |
| POST | /api/partner/stores/{store_id}/chat/threads/{thread_id}/messages | Send chat message (masked) |
| GET | /api/partner/stores/{store_id}/coupons | List coupons |
| POST | /api/partner/stores/{store_id}/coupons | Create coupon |
| PUT | /api/partner/stores/{store_id}/delivery-modes | Configure platform/partner/pickup modes |
| PUT | /api/partner/stores/{store_id}/hours | Set business hours |
| POST | /api/partner/stores/{store_id}/inventory/bulk | Bulk inventory update |
| GET | /api/partner/stores/{store_id}/menus | List menus |
| POST | /api/partner/stores/{store_id}/menus | Create menu |
| GET | /api/partner/stores/{store_id}/menus/{menu_id}/items | List items in menu |
| PUT | /api/partner/stores/{store_id}/menus/{menu_id}/items/{item_id} | Create or update item |
| GET | /api/partner/stores/{store_id}/orders | List orders with filters |
| GET | /api/partner/stores/{store_id}/orders/{order_id} | Order details |
| POST | /api/partner/stores/{store_id}/orders/{order_id}/accept | Accept order |
| POST | /api/partner/stores/{store_id}/orders/{order_id}/ready | Mark order as ready for pickup/delivery |
| POST | /api/partner/stores/{store_id}/orders/{order_id}/reject | Reject order with reason |
| PUT | /api/partner/stores/{store_id}/pricing-profiles | Create or update pricing profiles |
| GET | /api/partner/stores/{store_id}/promotions | List promotions |
| POST | /api/partner/stores/{store_id}/promotions | Create promotion |
| GET | /api/ssot/decisions | List decisions with pagination and filters. |
| POST | /api/ssot/decisions | Create a new decision record, immutable with audit trail. |
| GET | /api/ssot/guards/report | Fetch latest guards report and metrics. |
| POST | /api/ssot/guards/run | Trigger guards execution with scope selection. Step-Up required. |
| POST | /api/ssot/inbound | Inbound provider webhook with HMAC and anti-replay. |
| GET | /api/ssot/index | Fetch global SSOT index summary with locks and guards status. |
| PUT | /api/ssot/index | Update SSOT index fields (locked services/apps, guards). |
| GET | /api/ssot/registry/chats | List chat registry entries and link status. |
| POST | /api/ssot/registry/patch | Apply chat registry patch (append-only). |
| POST | /api/ssot/snapshots | Produce a pre/post snapshot with SHA256 of artifacts. |
| POST | /crm/support/export/masked | Export masked dataset only |
| POST | /crm/support/inbound/events | Inbound provider webhook events |
| GET | /crm/support/tickets | List tickets with filters and pagination |
| GET | /crm/support/tickets/{ticket_id} | Get ticket details and timeline |
| POST | /crm/support/tickets/{ticket_id}/assign | Assign or reassign ticket owner |
| POST | /crm/support/tickets/{ticket_id}/attachments | Upload attachment with antivirus scan |
| POST | /crm/support/tickets/{ticket_id}/chat/redact | Redact PII from chat transcript |
| GET | /crm/support/tickets/{ticket_id}/notes | List ticket notes with cursor |
| POST | /crm/support/tickets/{ticket_id}/notes | Add encrypted internal note |
| PATCH | /crm/support/tickets/{ticket_id}/status | Update ticket status with Step-Up |
| PATCH | /dash/qa/policies |  |
| GET | /dash/qa/runs |  |
| POST | /dash/qa/runs |  |
| GET | /dash/qa/runs/history |  |
| GET | /dash/qa/runs/{run_id} |  |
| POST | /dash/qa/runs/{run_id}/approve |  |
| POST | /dash/qa/runs/{run_id}/execute |  |
| POST | /dash/qa/runs/{run_id}/reject |  |
| GET | /dash/qa/runs/{run_id}/report |  |
| POST | /dash/qa/webhooks/ci |  |
| PATCH | /fin/cod/controls |  |
| POST | /fin/exports |  |
| GET | /fin/exports/{id} |  |
| GET | /fin/ledger/entries |  |
| POST | /fin/ledger/journal |  |
| GET | /fin/payouts |  |
| POST | /fin/payouts |  |
| GET | /fin/payouts/{id} |  |
| POST | /fin/reconcile/run |  |
| GET | /fin/reports/kpis |  |
| GET | /fin/settlements |  |
| POST | /fin/settlements |  |
| GET | /fin/settlements/{id} |  |
| POST | /fin/settlements/{id}/approve |  |
| POST | /pay/confirm | Confirm payment after provider callback. |
| POST | /wallet/captures/adjust | Adjust capture amount for substitutions/returns (server-side) |
| POST | /wallet/intents | Create payment intent for goods amount. |
| GET | /wallet/intents/{id} | Poll payment intent status. |

_source_sha256: 5f038d7e861808cc12f103eadeb02db539f069b1d22664757316fdf675ba54b6_