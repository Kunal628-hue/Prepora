import os

crud_path = "/Users/rohitkgupta/Planora/Prepora/backend/crud.py"
with open(crud_path, "r") as f:
    crud = f.read()

# Replace passlib usage
crud = crud.replace("from passlib.context import CryptContext", "import bcrypt")
crud = crud.replace('pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")', "")
crud = crud.replace("pwd_context.hash(user_in.password)", "bcrypt.hashpw(user_in.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')")

with open(crud_path, "w") as f:
    f.write(crud)

main_path = "/Users/rohitkgupta/Planora/Prepora/backend/main.py"
with open(main_path, "r") as f:
    main = f.read()

main = main.replace("from backend.crud import pwd_context", "import bcrypt")
main = main.replace("if not pwd_context.verify(payload.password, user.password_hash):", 
"if not bcrypt.checkpw(payload.password.encode('utf-8'), user.password_hash.encode('utf-8')):")

with open(main_path, "w") as f:
    f.write(main)

