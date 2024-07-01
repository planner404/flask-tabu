from datetime import datetime, timezone

from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so

from app import db
from app import login
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


class User(UserMixin, db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    username: so.Mapped[str] = so.mapped_column(sa.String(64), index=True, unique=True)
    #name: so.Mapped[str] = so.mapped_column(sa.String(64), index=True)
    email: so.Mapped[str] = so.mapped_column(sa.String(120), index=True, unique=True)
    password_hash: so.Mapped[Optional[str]] = so.mapped_column(sa.String(256))
    created_at: so.Mapped[datetime] = so.mapped_column(index=True, default=lambda: datetime.now(timezone.utc))

    stats: so.WriteOnlyMapped['Stat'] = so.relationship(back_populates='owner')

    def __repr__(self):
        return '<User, Name: "{}", E-Mail: "{}", Created at: "{}">'.format(self.username, self.email, self.created_at)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Stat(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(User.id), index=True)
    
    playedgames: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    correct: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    wrong: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    skipped: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)
    blackword: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False, default=0)

    owner: so.Mapped[User] = so.relationship(back_populates='stats')

    def __repr__(self):
        return '<Stat, user_id: "{}", playedgames: "{}">'.format(self.user_id, self.playedgames)

@login.user_loader
def load_user(id):
    return db.session.get(User, int(id))