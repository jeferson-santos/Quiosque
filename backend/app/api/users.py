from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.user import (
    create_user,
    delete_user,
    get_user_by_username,
    get_users,
    update_user_password,
)
from app.dependencies import get_current_user, get_db
from app.schemas.auth import TokenData
from app.schemas.user import RoleEnum, UserCreate, UserOut, UserPasswordUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    existing_user = get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already registered"
        )
    return create_user(db, user)


@router.get("/", response_model=List[UserOut], status_code=status.HTTP_200_OK)
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    users = get_users(db, skip=skip, limit=limit)
    return users


@router.get("/{username}", response_model=UserOut, status_code=status.HTTP_200_OK)
def read_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    # Administrador pode buscar qualquer usuário
    if current_user.role == "administrator":
        user = get_user_by_username(db, username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user
    # Garçom ou outros papéis só podem buscar o próprio usuário
    if current_user.username != username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.delete("/{username}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    deleted = delete_user(db, username)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    # No return needed for 204 No Content


@router.put(
    "/{username}/password", response_model=UserOut, status_code=status.HTTP_200_OK
)
def change_password(
    username: str,
    body: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden"
        )
    updated_user = update_user_password(db, username, body.password)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return updated_user


from app.crud.user import update_user_role
from app.schemas.user import UserRoleUpdate


@router.put("/{username}/role", response_model=UserOut, status_code=status.HTTP_200_OK)
def update_user_role_api(
    username: str,
    body: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.role != "administrator":
        raise HTTPException(status_code=403, detail="Access forbidden")

    updated_user = update_user_role(db, username, body.role)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return updated_user
