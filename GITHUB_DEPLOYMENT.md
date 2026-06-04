# מדריך להעלאת הפרויקט ל-GitHub והפעלת אתר חינמי

מדריך זה מפרט את הצעדים הנדרשים כדי להעלות את קוד שמש האסוציאציות לחשבון ה-GitHub שלך, ולהפעיל אותו בחינם מכל מקום בעולם דרך **GitHub Pages**.

---

## שלב 1: יצירת מאגר (Repository) ב-GitHub

1. היכנס לחשבון ה-GitHub שלך.
2. עבור לקישור הבא ליצירת מאגר חדש: **[https://github.com/new](https://github.com/new)**
3. הגדר את הפרטים הבאים:
   * **Repository name**: `mindmap-association-sun`
   * **Description** (אופציונלי): `שמש אסוציאציות אינטראקטיבית עם לשוניות ותוכניות עבודה מפורטות`
   * **Public / Private**: בחר ב-**Public** (ציבורי) על מנת שתוכל להשתמש בשירות האירוח החינמי.
4. **חשוב מאוד**: אל תסמן אף אחת מתיבות הבחירה (כמו Add a README או Add .gitignore) – אנו נשתמש בקבצים הקיימים במחשב שלך.
5. לחץ על הכפתור הירוק **Create repository**.

---

## שלב 2: קישור המאגר המקומי והעלאת הקבצים

פתח את אפליקציית ה-**Terminal** במחשב שלך והרץ את הפקודות הבאות לפי הסדר. 

> [!NOTE]
> שים לב להחליף את הכיתוב `YOUR_USERNAME` בשם המשתמש האמיתי שלך ב-GitHub (באותיות קטנות).

```bash
# 1. ניווט אל תיקיית הפרויקט במחשב שלך
cd /Users/tomlevy/.gemini/antigravity/scratch/mindmap-association-sun

# 2. חיבור התיקייה המקומית למאגר שיצרת ב-GitHub
git remote add origin https://github.com/YOUR_USERNAME/mindmap-association-sun.git

# 3. הגדרת הענף הראשי כ-main
git branch -M main

# 4. העלאת הקבצים לראשונה ל-GitHub
git push -u origin main
```

*הערה: אם זו הפעם הראשונה שאתה מעלה קוד מפתח זה, הטרמינל עשוי לבקש ממך לבצע התחברות (Authentication) באמצעות שם משתמש וסיסמה או באמצעות GitHub Personal Access Token.*

---

## שלב 3: הפעלת הקישור החינמי (GitHub Pages)

לאחר שהעלאת הקוד ל-GitHub הסתיימה בהצלחה:

1. היכנס בדפדפן לעמוד המאגר החדש שלך ב-GitHub.
2. לחץ על לשונית **Settings** (הגדרות) המופיעה בבר העליון של המאגר.
3. בתפריט הצד השמאלי, תחת קטגוריית Code and automation, לחץ על **Pages**.
4. תחת הסעיף **Build and deployment** -> **Source**:
   * ודא שמוגדר **Deploy from a branch**.
   * תחת **Branch**, שנה את הבחירה מ-`None` לענף **`main`**.
   * השאר את התיקייה כ-**`/ (root)`** ולחץ על כפתור **Save** (שמור).

---

## שלב 4: גישה לאתר שלך מכל מקום

לאחר כדקה מהלחיצה על שמירה, GitHub יבנה ויפרסם את האתר שלך.
האתר יהיה זמין לגישה ולסיעור מוחות בכתובת הבאה:

👉 **`https://YOUR_USERNAME.github.io/mindmap-association-sun/`**

*(החלף את `YOUR_USERNAME` בשם המשתמש שלך ב-GitHub)*

---

### עדכון קוד עתידי
אם בעתיד נערוך או נשנה את הקוד ותרצה לעדכן את האתר החי, תוכל לעשות זאת בקלות על ידי הרצת הפקודות הבאות בטרמינל:
```bash
cd /Users/tomlevy/.gemini/antigravity/scratch/mindmap-association-sun
git add .
git commit -m "עדכון תכונות חדשות"
git push origin main
```
האתר בקישור יתעדכן אוטומטית בתוך מספר שניות!
