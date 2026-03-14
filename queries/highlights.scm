(boolean) @boolean

[
  (line_comment)
  (block_comment)
] @comment

[
 "after"
 "array"
 "at"
 "before"
 "box"
 "case"
 "do"
 "esac"
 "eta"
 "for"
 "fun"
 "import"
 "infix"
 "infixl"
 "infixr"
 "lazy"
 "od"
 "of"
 "public"
 "sexp"
 "skip"
 "str"
 "val"
 "var"
 "while"
 "let"
 "in"
] @keyword

(decimal) @number

[
 (infix)
 ":="
 ":"
 "!!"
 "&&"
 "=="
 "!="
 "<="
 "<"
 ">="
 ">"
 "+"
 "-"
 "*"
 "/"
 "%"
] @operator

[
 "("
 ")"
 "{"
 "}"
 "["
 "]"
] @punctuation.bracket

[
 "|"
 ";"
 "."
 "#"
 "->"
 ","
] @punctuation.delimiter

[
 (string)
 (char)
] @string

[
 "if"
 "fi"
 "then"
 "elif"
 "else"
] @conditional

[
 "import"
] @include
