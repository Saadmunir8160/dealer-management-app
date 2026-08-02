# Voice Order — local testing

## Fast format (same LN codes as Item Code picker)
Orders → **Voice** → speak or type using **LN Code** from the list:

```text
5601 600 bags ORD-111
```

| Part | Meaning |
|------|--------|
| `5601` | LN Code (e.g. OPC Bags) — must exist in Please Select Item Code |
| `600 bags` | Only `500` or `600` |
| `ORD-111` | Coupon (required) |

### Examples from your catalog
```text
5601 600 bags ORD-111
5604 500 bags ORD-222
5703 600 bags ORD-333
0021 500 bags ORD-444
```

Voice matches against the **live product list** (same as the modal), not hard-coded names.

## Backend / env
API: `http://127.0.0.1:5246` · Login: `admin` / `Admin@123`
