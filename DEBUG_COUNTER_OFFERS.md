# Counter Offers Debug Guide

## Issue: Counter offers not showing in dealer dashboard

### Step 1: Check Dealer Email in Frontend
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for this log: `API request to: http://localhost:8088/postings/counter-offers/pending/[EMAIL]`
4. Check what email is being used in the URL

### Step 2: Check Backend Logs
1. Check backend console for logs from CounterOfferService
2. Look for: `Fetching pending counter offers for dealer: [EMAIL]`
3. Check if it shows: `Found X posts for dealer: [EMAIL]`

### Step 3: Check Database
1. Check `postings` table - what email are posts created with?
2. Check `counter_offers` table - are there any records?
3. Verify post_id in counter_offers matches posts table

### Step 4: Frontend localStorage Check
1. In browser console, run: `localStorage.getItem("dealerInfo")`
2. Check if the email matches the logged-in user

### Step 5: Manual API Test
1. Open browser developer tools
2. Go to Network tab
3. Manually call: `GET http://localhost:8088/postings/counter-offers/pending/bhanu@gmail.com`
4. Check the response

## Common Issues:

### Issue 1: Email Mismatch
- **Problem**: Posts created with `bhanu@gmail.com` but frontend calling with `dealer@example.com`
- **Solution**: Fix localStorage or dealer info retrieval

### Issue 2: No Counter Offers in Database
- **Problem**: Counter offers table is empty
- **Solution**: Submit counter offers from technician side first

### Issue 3: Backend Service Issues
- **Problem**: Service not finding posts for the dealer
- **Solution**: Check if posts exist for the dealer email being queried

### Issue 4: API Gateway Routing
- **Problem**: Gateway not routing to correct service
- **Solution**: Check if `http://localhost:8088/postings` routes to posts service

## Quick Fix Commands:

### Reset localStorage to correct dealer:
```javascript
localStorage.setItem("dealerInfo", JSON.stringify({
  email: "bhanu@gmail.com",
  name: "bhanu", 
  location: "Dallas, Texas"
}));
window.location.reload();
```

### Check API directly in browser console:
```javascript
fetch('http://localhost:8088/postings/counter-offers/pending/bhanu@gmail.com')
  .then(r => r.json())
  .then(data => console.log('Counter offers:', data));
```
