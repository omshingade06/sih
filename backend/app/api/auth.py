from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.entities import User, AuditLog
from app.schemas.schemas import Token, LoginRequest, UserResponse, UserCreate, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        # Log failed attempt
        audit = AuditLog(
            user_id="anonymous",
            user_name=request.username,
            role="UNKNOWN",
            action="LOGIN_FAILED",
            entity_type="USER",
            entity_id=request.username,
            reason="Invalid credentials"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact Administrator."
        )

    # Log successful login
    audit = AuditLog(
        user_id=str(user.id),
        user_name=user.full_name or user.username,
        role=user.role,
        action="LOGIN_SUCCESS",
        entity_type="USER",
        entity_id=str(user.id),
        reason="Successful authentication"
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "full_name": user.full_name or user.username,
        "role": user.role
    }

@router.get("/me", response_model=UserResponse)
def get_current_user(token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()

@router.post("/users", response_model=UserResponse)
def create_user(req: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    user = User(
        username=req.username,
        email=req.email,
        full_name=req.full_name or req.username,
        role=req.role.upper(),
        hashed_password=get_password_hash(req.password),
        is_active=True
    )
    db.add(user)
    db.flush()

    audit = AuditLog(
        user_id="admin",
        user_name="Administrator",
        role="ADMIN",
        action="CREATE_USER",
        entity_type="USER",
        entity_id=str(user.id),
        after_state={"username": user.username, "email": user.email, "role": user.role},
        reason=f"Registered user {user.username} with role {user.role}"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, req: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    before_state = {"email": user.email, "role": user.role, "is_active": user.is_active}
    
    if req.email is not None:
        user.email = req.email
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.role is not None:
        user.role = req.role.upper()
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.password:
        user.hashed_password = get_password_hash(req.password)
        
    audit = AuditLog(
        user_id="admin",
        user_name="Administrator",
        role="ADMIN",
        action="UPDATE_USER",
        entity_type="USER",
        entity_id=str(user.id),
        before_state=before_state,
        after_state={"email": user.email, "role": user.role, "is_active": user.is_active},
        reason=f"Updated account details for user {user.username}"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return user
