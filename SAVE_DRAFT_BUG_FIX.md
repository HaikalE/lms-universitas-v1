# 🐛 Bug Fix: Simpan Draft Functionality

## **Problem Statement**
Button "Simpan Draft" di halaman submit assignment tidak berfungsi dengan benar - malah langsung melakukan submit submission alih-alih menyimpan sebagai draft.

## **Root Cause Analysis**

### **Frontend (✅ SUDAH BENAR)**
- Button "Simpan Draft" memanggil `handleSubmit(true)` dengan benar
- Button "Kirim Tugas" memanggil `handleSubmit(false)` dengan benar  
- FormData mengirim status `DRAFT` atau `SUBMITTED` dengan benar

### **Backend (❌ BUG DITEMUKAN)**

#### **Problem 1: Missing Status Field**
```typescript
// CreateSubmissionDto TIDAK memiliki field status
export class CreateSubmissionDto {
  content?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  // ❌ MISSING: status field
}
```

#### **Problem 2: Hardcoded Status**
```typescript
// assignments.service.ts - submitAssignment method
Object.assign(submission, {
  ...createSubmissionDto,
  status: SubmissionStatus.SUBMITTED,  // ⚠️ HARDCODE!
  submittedAt: now,
  isLate,
});
```

## **Solution Implemented**

### **Fix 1: Updated CreateSubmissionDto**
```typescript
export class CreateSubmissionDto {
  @IsOptional()
  @IsString({ message: 'Konten submission harus berupa string' })
  content?: string;

  @IsOptional()
  @IsString({ message: 'Nama file harus berupa string' })
  fileName?: string;

  @IsOptional()
  @IsString({ message: 'Path file harus berupa string' })
  filePath?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Ukuran file harus berupa angka' })
  @Min(0, { message: 'Ukuran file tidak boleh negatif' })
  fileSize?: number;

  // ✅ ADDED: Status field dengan validasi
  @IsOptional()
  @IsEnum(SubmissionStatus, { message: 'Status submission tidak valid' })
  status?: SubmissionStatus;
}
```

### **Fix 2: Updated submitAssignment Method**
```typescript
async submitAssignment(
  assignmentId: string,
  createSubmissionDto: CreateSubmissionDto,
  currentUser: User,
) {
  // ... validation code ...

  // ✅ FIX: Use status from DTO, default to DRAFT
  const submissionStatus = createSubmissionDto.status || SubmissionStatus.DRAFT;

  // ✅ FIX: Check duplicate submission only for actual submissions
  if (existingSubmission && 
      existingSubmission.status === SubmissionStatus.SUBMITTED && 
      submissionStatus === SubmissionStatus.SUBMITTED) {
    throw new BadRequestException('Tugas sudah dikumpulkan sebelumnya');
  }

  const now = new Date();
  const isLate = now > assignment.dueDate;

  // ✅ FIX: Only check late submission for actual submissions, not drafts
  if (submissionStatus === SubmissionStatus.SUBMITTED && 
      isLate && 
      !assignment.allowLateSubmission) {
    throw new BadRequestException('Waktu pengumpulan tugas sudah berakhir');
  }

  // ✅ FIX: Build submission data properly
  const submissionData: any = {
    ...createSubmissionDto,
    status: submissionStatus,  // Use from DTO
    isLate,
  };

  // ✅ FIX: Only set submittedAt for actual submissions, not drafts
  if (submissionStatus === SubmissionStatus.SUBMITTED) {
    submissionData.submittedAt = now;
  }

  Object.assign(submission, submissionData);
  return this.submissionRepository.save(submission);
}
```

## **Expected Behavior After Fix**

### **Draft Flow:**
1. User clicks "Simpan Draft"
2. Frontend sends `status: SubmissionStatus.DRAFT`
3. Backend saves with:
   - `status: DRAFT`
   - `submittedAt: null`
   - No late submission validation
   - Can be edited later

### **Submit Flow:**
1. User clicks "Kirim Tugas"  
2. Frontend sends `status: SubmissionStatus.SUBMITTED`
3. Backend saves with:
   - `status: SUBMITTED`
   - `submittedAt: current timestamp`
   - Late submission validation applied
   - Cannot be edited after submission

## **Testing Checklist**
- [ ] Test "Simpan Draft" - should save as draft without submission timestamp
- [ ] Test "Kirim Tugas" - should submit with submission timestamp
- [ ] Test editing draft then submitting
- [ ] Test late submission validation (should only apply to actual submissions)
- [ ] Test duplicate submission prevention (should only apply to actual submissions)

## **Files Modified**
- `backend/src/assignments/dto/create-submission.dto.ts`
- `backend/src/assignments/assignments.service.ts`

## **Commit History**
- `a09fd08`: fix: Add status field to CreateSubmissionDto to support draft/submit functionality
- `f0fd123`: fix: Fix submitAssignment method to respect status from DTO for draft/submit functionality

---
**Fixed Date:** May 28, 2025  
**Status:** ✅ Resolved and Merged to Main
