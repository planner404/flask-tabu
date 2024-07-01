from flask import render_template, flash, redirect, url_for, jsonify, request
from app import app
from app import db
from app.models import User
from app.models import Stat
from app.forms import LoginForm
from app.forms import RegistrationForm
from app.forms import EditProfileForm

from flask_login import current_user, login_user
from flask_login import logout_user
import sqlalchemy as sa


from flask_login import login_required

from flask import request
from urllib.parse import urlsplit

@app.route('/')
@app.route('/index')
#@login_required
def index():
    return render_template("index.html")

@app.route('/game_settings')
def game_settings():
    return render_template('game_settings.html')

@app.route('/game_gameplay')
def game_gameplay():
    return render_template('game_gameplay.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == form.username.data))
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)

        next_page = request.args.get('next')
        if not next_page or urlsplit(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    
    return render_template('login.html', title='Sign In', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

# Data Inputs
@app.route('/api/data', methods=['POST'])
@login_required
def handle_data():
    if request.method == 'POST':
        data = request.get_json()
        stat_type = data.get('stat_type')
        increment = data.get('increment', 1)

        # Fetch the current user's stat
        stat = Stat.query.filter_by(user_id=current_user.id).first()

        if stat and stat_type in Stat.__table__.columns:
            current_value = getattr(stat, stat_type, None)
            if current_value is not None:
                setattr(stat, stat_type, current_value + increment)
                db.session.commit()
                return jsonify({'status': 'success', stat_type: getattr(stat, stat_type)})
        
        return jsonify({'status': 'error', 'message': 'Invalid stat type or stat not found'}), 400

@app.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = EditProfileForm()
    if form.validate_on_submit():
        current_user.username = form.username.data
        db.session.commit()
        flash('Your changes have been saved.')
        return redirect(url_for('edit_profile'))
    elif request.method == 'GET':
        form.username.data = current_user.username

    stats = Stat.query.filter_by(user_id=current_user.id).first()

    return render_template('edit_profile.html', form=form, stats=stats)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500
