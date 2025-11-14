# WLT - بيانات مولدة

## مسارات OpenAPI
| method | path | summary |
| --- | --- | --- |
| POST | /api/wlt/intents | إنشاء نية دفع جديدة لطلب تابع لخدمة DSH أو خدمة أخرى. |
| GET | /api/wlt/intents/{intent_id} | استعلام حالة نية الدفع الحالية. |
| POST | /api/wlt/intents/{intent_id}/confirm | تأكيد نية الدفع بعد رد مزود الدفع. |
| POST | /api/wlt/intents/{intent_id}/capture-adjust | تعديل قيمة الالتقاط بعد تغييرات في الطلب (مثل الاستبدال أو الإرجاع). |
| POST | /api/wlt/inbound/refunds | Webhook لاستلام أحداث الاسترداد أو الـ chargeback من مزود الدفع. |

_source_sha256: e6a478f950a31ea6d5d69ca138938f1e1ac41b5c54238d487f6c483920dfca02_