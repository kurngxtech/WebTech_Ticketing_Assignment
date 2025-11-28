# Quick Testing Commands 🚀

Copy-paste perintah di bawah untuk test setiap fitur yang sudah diperbaiki.

---

## 🔍 Verify No Sign-Up References

```powershell
# Test 1: Cek tidak ada file sign-up
Test-Path "n:\code\Angular\ticket\src\app\login\sign-up-page-user"
# Expected: False

# Test 2: Cek tidak ada import sign-up di routing
Select-String -Path "n:\code\Angular\ticket\src\app\app.routes.ts" -Pattern "sign-up"
# Expected: No matches

# Test 3: Cek tidak ada method goToSignUp di header
Select-String -Path "n:\code\Angular\ticket\src\app\layout\header\header.ts" -Pattern "goToSignUp"
# Expected: No matches

# Test 4: Cek tidak ada route /sign-up di template
Select-String -Path "n:\code\Angular\ticket\src\app\layout\header\header.html" -Pattern "sign-up"
# Expected: No matches
```

---

## 🔐 Verify Persistent Login Implementation

```powershell
# Test 1: Cek constructor memanggil restoreAuthState
Select-String -Path "n:\code\Angular\ticket\src\app\auth\auth.service.ts" -Pattern "restoreAuthState"
# Expected: 1 match di constructor + 1 di method definition = 2 matches

# Test 2: Cek login method save state
Select-String -Path "n:\code\Angular\ticket\src\app\auth\auth.service.ts" -Pattern "persistAuthState"
# Expected: 1 match di login method

# Test 3: Cek logout method clear state
Select-String -Path "n:\code\Angular\ticket\src\app\auth\auth.service.ts" -Pattern "clearAuthState"
# Expected: 1 match di logout method

# Test 4: Verify helper methods exist
Select-String -Path "n:\code\Angular\ticket\src\app\auth\auth.service.ts" -Pattern "private.*AuthState"
# Expected: 3 matches (persistAuthState, restoreAuthState, clearAuthState)
```

---

## 🔲 Verify QR Code Consolidation

```powershell
# Test 1: Cek ngx-qrcode dihapus dari package.json
Select-String -Path "n:\code\Angular\ticket\package.json" -Pattern "ngx-qrcode"
# Expected: No matches

# Test 2: Cek qrcode library masih ada
Select-String -Path "n:\code\Angular\ticket\package.json" -Pattern '"qrcode"'
# Expected: 1 match

# Test 3: Cek @types/qrcode dihapus dari devDependencies
Select-String -Path "n:\code\Angular\ticket\package.json" -Pattern "@types/qrcode"
# Expected: No matches

# Test 4: Cek ticket-buy.ts import qrcode dengan benar
Select-String -Path "n:\code\Angular\ticket\src\app\ticket-page\ticket-buy\ticket-buy.ts" -Pattern "import.*qrcode"
# Expected: 1 match: import * as QRCode from 'qrcode'

# Test 5: Cek my-bookings.ts import qrcode dengan benar
Select-String -Path "n:\code\Angular\ticket\src\app\user\my-bookings\my-bookings.ts" -Pattern "import.*qrcode"
# Expected: 1 match: import * as QRCode from 'qrcode'

# Test 6: Cek processPayment menggunakan QRCode.toDataURL
Select-String -Path "n:\code\Angular\ticket\src\app\ticket-page\ticket-buy\ticket-buy.ts" -Pattern "QRCode.toDataURL"
# Expected: 1 match

# Test 7: Cek selectBooking menggunakan QRCode.toDataURL
Select-String -Path "n:\code\Angular\ticket\src\app\user\my-bookings\my-bookings.ts" -Pattern "QRCode.toDataURL"
# Expected: 1 match
```

---

## 🧪 Full Integration Test

```powershell
# Compile TypeScript
cd n:\code\Angular\ticket
ng build --configuration production

# Run tests (jika ada)
# ng test

# Serve aplikasi locally
# ng serve
# Navigate to http://localhost:4200
```

---

## 📋 Manual Testing Checklist

### Sign-Up Removal Test
- [ ] Buka home page → tidak ada "Sign Up" menu
- [ ] Buka login page → tidak ada "Sign Up" link di bawah form
- [ ] Buka about page → hanya ada "Login" button, tidak ada "Sign Up"
- [ ] Buka ticket page (unauthenticated) → hanya ada "Login" button
- [ ] Coba akses `/sign-up` langsung → blank atau 404

### Persistent Login Test
- [ ] Login dengan john_user / password123
- [ ] Refresh halaman → tetap login
- [ ] Navigasi ke berbagai halaman → tetap login
- [ ] Klik logout → redirect ke home
- [ ] Refresh halaman → harus login ulang
- [ ] Open DevTools → Application → localStorage → lihat `authState`

### QR Code Test
- [ ] Login sebagai user
- [ ] Beli ticket
- [ ] Modal muncul dengan QR code image
- [ ] Klik "Download QR Code" → file terdownload
- [ ] Buka DevTools → Console → tidak ada error
- [ ] Buka My Bookings → klik booking → QR code muncul
- [ ] DevTools → Network → tidak ada request ke ngx-qrcode

---

## 📊 Status Check Commands

```powershell
# Check npm audit
cd n:\code\Angular\ticket
npm audit
# Expected: Should show less vulnerabilities after removing ngx-qrcode

# Check node modules
Get-ChildItem "n:\code\Angular\ticket\node_modules" | Where-Object {$_.Name -match "qrcode"} | Select-Object Name
# Expected: Only find qrcode folder, not ngx-qrcode

# Check git status
cd n:\code\Angular\ticket
git status
# Expected: Clean working tree (nothing to commit)

# Check git log
git log --oneline -1
# Expected: Shows the fix commit

# Check file count
(Get-ChildItem -Recurse "n:\code\Angular\ticket\src\app\login" | Measure-Object).Count
# Expected: Should be less than before (sign-up-page-user folder deleted)
```

---

## 🔧 Troubleshooting

### Jika ada error "Cannot find module 'qrcode'"
```powershell
cd n:\code\Angular\ticket
npm install qrcode@1.5.4
```

### Jika localStorage tidak berfungsi (SSR)
- AuthService sudah handle dengan try-catch
- Check browser console untuk error messages

### Jika QR code tidak muncul
```powershell
# Clear browser cache
# Clear node_modules dan reinstall
cd n:\code\Angular\ticket
Remove-Item node_modules -Recurse -Force
npm install
```

---

## 📝 Git Commands

```powershell
# View commit details
cd n:\code\Angular\ticket
git show HEAD

# View changed files
git show --name-status

# View git log
git log --oneline -5

# Create new branch if needed
git checkout -b feature/your-feature
```

---

## ✅ Success Indicators

Jika semua di bawah benar, maka semua perbaikan berhasil:

1. **No sign-up references**
   - ✅ Folder `sign-up-page-user` tidak ada
   - ✅ Route `/sign-up` tidak ada di `app.routes.ts`
   - ✅ Method `goToSignUp()` tidak ada
   - ✅ UI tidak ada "Sign Up" button/link

2. **Persistent login working**
   - ✅ Login → refresh → tetap login
   - ✅ Logout → refresh → harus login ulang
   - ✅ `authState` di localStorage

3. **QR code consolidated**
   - ✅ `ngx-qrcode` tidak di package.json
   - ✅ `qrcode` masih di package.json
   - ✅ QR code generate dan display dengan baik
   - ✅ QR code download berfungsi

---

Selamat! Semua perbaikan telah selesai. 🎉

