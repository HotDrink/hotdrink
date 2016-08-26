(let ((default-directory  "~/.emacs.d/"))
  (normal-top-level-add-subdirs-to-load-path))

(require 'org)

 (custom-set-faces
   `(font-lock-builtin-face ((t (:foreground "#006FE0"))))
   `(font-lock-comment-delimiter-face ((t (:foreground "#8D8D84")))) ; #696969
   `(font-lock-comment-face ((t (:slant italic :foreground "#8D8D84")))) ; #696969
   `(font-lock-constant-face ((t (:foreground "#8b1a1a")))) ; "#00008b" ; "#D0372D"
   `(font-lock-doc-face ((t (:foreground "#036A07"))))
   `(font-lock-function-name-face ((t (:weight normal :foreground "#006699"))))
   `(font-lock-keyword-face ((t (:bold nil :foreground "#0000FF")))) ; #3654DC
   `(font-lock-preprocessor-face ((t (:foreground "#808080"))))
   `(font-lock-regexp-grouping-backslash ((t (:weight bold :inherit nil))))
   `(font-lock-regexp-grouping-construct ((t (:weight bold :inherit nil))))
   `(font-lock-string-face ((t (:foreground "#008000"))))
   `(font-lock-type-face ((t (:weight normal :foreground "#6434A3"))))
   `(font-lock-variable-name-face ((t (:weight normal :foreground "#BA36A5")))) ; #800080
   `(font-lock-warning-face ((t (:weight bold :foreground "red"))))
   )

(load-theme 'dichromacy)

(custom-set-variables
 '(make-backup-files nil)
 '(org-confirm-babel-evaluate nil)
 '(org-src-preserve-indentation t)
 '(org-babel-use-quick-and-dirty-noweb-expansion t)
 '(org-src-fontify-natively t)
 '(org-html-validation-link nil)
 '(org-entities-user
   '("ldquo" "``" nil "&ldquo;" "\"" "\"" "“")
   '("rdquo" "''" nil "&rdquo;" "\"" "\"" "”")))

(defun publish-org-doc ()
  (let ((fname (car (split-string
                   (car (last (split-string (buffer-file-name) "/"))) "\\."))))
  (org-babel-tangle)
  (org-html-export-as-html)
  (write-file (format "publish/%s.html" fname))))
