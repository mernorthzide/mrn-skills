---
name: finish-worktree
description: Finishes the current git worktree by landing its branch on main. Checks whether it is already merged, merges the latest origin/main in, runs the tests, fast-forwards main and pushes it, then offers to delete the worktree. Use when the user says "finish this worktree", "finish worktree", "จบ worktree", "เอา worktree ขึ้น main", "merge worktree เข้า main".
argument-hint: "[ชื่อ branch หลัก ถ้าไม่ระบุจะหาจาก origin/HEAD]"
---

# Finish worktree

การเรียก skill นี้ถือว่าผู้ใช้อนุญาตให้ merge และ push branch หลักแล้ว ส่วนการลบ worktree ต้องถามก่อนเสมอ ห้าม `--force` push ทุกกรณี

ตัวแปรที่ใช้ทั้ง skill: `MAIN` = branch หลัก, `BR` = branch ปัจจุบัน, `WT` = path ของ worktree นี้, `ROOT` = path ของ worktree หลัก ตัวแปร shell ไม่ข้ามระหว่าง Bash call ให้แทนค่าจริงที่ได้จากขั้น 1 ลงในทุกคำสั่ง

## 1. ตรวจสภาพ

```bash
WT=$(git rev-parse --show-toplevel)
BR=$(git branch --show-current)
ROOT=$(git worktree list --porcelain | awk 'NR==1{print $2}')
MAIN=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@'); MAIN=${MAIN:-main}
git status --porcelain
git remote
```

ถ้าผู้ใช้ส่งชื่อ branch หลักมาเป็น argument ให้ใช้ค่านั้นแทน `MAIN`

- `WT` = `ROOT` แปลว่าไม่ได้อยู่ใน linked worktree ให้หยุดแล้วบอกผู้ใช้
- `BR` ว่าง (detached HEAD) หรือ `BR` = `MAIN` ให้หยุดแล้วบอกผู้ใช้
- มีไฟล์ค้าง ให้ดู `git status` กับ `git diff` แล้วถามผู้ใช้ว่าจะ commit (เสนอ message ให้) หรือหยุด ห้ามทิ้งไฟล์เอง
- ไม่มี remote ให้ทำทุกขั้นแบบ local แล้วข้ามคำสั่ง fetch/push

## 2. ขึ้น main แล้วหรือยัง

```bash
git fetch origin
git merge-base --is-ancestor HEAD origin/$MAIN && echo MERGED
```

ถ้า `MERGED` (รวมกรณียังไม่มี commit ใหม่เลย) แจ้งว่า branch นี้อยู่บน main แล้ว แล้วข้ามไปขั้น 6

## 3. ดึง main ล่าสุดมาเช็คใน worktree

```bash
git merge origin/$MAIN
```

conflict ให้อ่านทั้งสองฝั่งแล้วแก้ ถ้าตัดสินไม่ได้ว่าฝั่งไหนถูก (logic ขัดกัน ไม่ใช่แค่ format) ให้ถามผู้ใช้ แก้เสร็จแล้ว `git add` + `git commit --no-edit`

## 4. ทดสอบ

หาคำสั่งจาก repo ตามลำดับ: `CLAUDE.md`/`AGENTS.md` > `package.json` scripts (`test`, `typecheck`, `lint`, `build` ที่มี) > `pytest` / `go test ./...` / `cargo test` / `make test` ถ้า dependency ยังไม่ได้ติดตั้งใน worktree นี้ ให้ติดตั้งก่อน (`npm ci` หรือตาม lockfile)

- รันจนผ่านทั้งหมด ไม่ผ่านให้หา root cause แล้วแก้ commit ใน branch นี้ แล้วรันใหม่
- repo ไม่มี test เลย ให้รัน build หรือ typecheck แทน และบอกในรายงานว่าไม่มี test
- ห้ามข้าม ห้ามปิด test เพื่อให้ผ่าน

## 5. merge เข้า main แล้ว push

ตอนนี้ `BR` มี `origin/$MAIN` อยู่ข้างในแล้ว จึง fast-forward ได้เสมอ

ถ้า worktree หลักอยู่ที่ `MAIN` และไม่มีไฟล์ค้าง:

```bash
git -C "$ROOT" merge --ff-only origin/$MAIN
git -C "$ROOT" merge --ff-only "$BR"
git -C "$ROOT" push origin $MAIN
```

ถ้าไม่ใช่ (worktree หลักอยู่ branch อื่นหรือมีไฟล์ค้าง) อย่าแตะ worktree หลัก ให้ push จากที่นี่:

```bash
git push origin "HEAD:$MAIN"
```

แล้วบอกผู้ใช้ว่า local `MAIN` ใน `ROOT` ยังไม่ขยับ ต้อง `git pull` เองตอนกลับไปที่นั่น

push ไม่ผ่าน ให้อ่านข้อความ error ก่อน ห้าม force:

- มี `fetch first` หรือ `non-fast-forward` แปลว่ามีคนดัน main ระหว่างทาง ให้กลับไปขั้น 3 ใหม่ (merge แล้ว test ใหม่) วนได้ไม่เกิน 3 รอบ เกินนั้นให้หยุดแจ้งผู้ใช้
- error อื่น เช่น `protected branch`, `GH006`, `not allowed to push`, `hook declined` หรือ permission denied แปลว่า main ไม่รับ push ตรง **ห้ามวนกลับ** ให้หยุดแล้วถามผู้ใช้ว่าจะเปิด PR ไหม (`git push -u origin "$BR"` แล้ว `gh pr create --base $MAIN`) ถ้าก่อนหน้านั้น fast-forward `MAIN` ใน `ROOT` ไปแล้ว ให้ถอยกลับด้วย `git -C "$ROOT" reset --keep origin/$MAIN`

ยืนยันผล: `git fetch origin && git merge-base --is-ancestor "$BR" origin/$MAIN && echo OK`

## 6. รายงานแล้วถามเรื่องลบ

สรุปสั้นๆ: branch, จำนวน commit ที่ขึ้นไป (`git log --oneline`), คำสั่ง test ที่รันกับผล, commit ล่าสุดของ main

แล้วใช้ AskUserQuestion ถาม "เสร็จแล้ว ลบ worktree นี้เลยไหม?" ตัวเลือก:

1. **ลบ worktree + branch** ลบ local branch และ remote branch (ถ้ามี) ด้วย
2. **ลบ worktree เก็บ branch ไว้**
3. **ยังไม่ลบ** จบเลย

ถ้าเลือกลบ:

1. ขณะยังอยู่ใน `WT` จด `SHA=$(git rev-parse HEAD)` และเช็คว่าเป็น Orca worktree ไหม (`orca worktree current` exit 0 = ใช่)
2. `cd "$ROOT"` ก่อน เพราะลบ directory ที่ shell ยืนอยู่ไม่ได้ และ Bash call ต่อไปจะพังถ้า cwd หายไป
3. ลบ worktree:
   - Orca worktree: `orca worktree rm --worktree path:"$WT"` (Orca ลบ local branch ที่ merge แล้วให้เองเสมอ)
   - session นี้เข้า worktree ด้วย EnterWorktree: ใช้ ExitWorktree แบบ remove
   - นอกนั้น: `git worktree remove "$WT"`
4. จัดการ branch:
   - ตัวเลือก 1: เช็คก่อนว่า `git merge-base --is-ancestor "$BR" origin/$MAIN` (ไม่มี remote ให้เทียบกับ `$MAIN`) ผ่านแล้วค่อย `git branch -D "$BR"` (ใช้ `-D` เพราะ `-d` เทียบกับ HEAD ของ `ROOT` ซึ่งอาจไม่ใช่ main) ถ้าไม่ผ่านให้หยุดบอกผู้ใช้ จากนั้น `git push origin --delete "$BR"` ถ้ามี remote branch ถ้า Orca ลบ local branch ไปแล้วให้ข้ามคำสั่ง `branch -D`
   - ตัวเลือก 2: ถ้า branch หายไปเพราะ Orca ลบ (`git rev-parse -q --verify "$BR"` ไม่เจอ) ให้สร้างคืน `git branch "$BR" "$SHA"`

แล้วจบ
