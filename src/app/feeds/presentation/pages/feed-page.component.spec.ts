import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FeedPageComponent } from './feed-page.component';
import { FeedService } from '../../domain/services/feed.service';
import { AuthService } from 'src/app/auth/domain/services/auth.service';
import { UserService } from 'src/app/profile/domain/services/user.service';
import { FeedPost, FeedResponse } from '../../domain/entities/feed.interface';
import { UserProfile } from 'src/app/profile/domain/entities/user.interfaces';

describe('FeedPageComponent', () => {
  let component: FeedPageComponent;
  let feedServiceSpy: jasmine.SpyObj<FeedService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const makePost = (over: Partial<FeedPost> = {}): FeedPost =>
    ({ id: 'p1', content: 'x', tags: [], is_public: true, author: { id: 'u1' } as any, ...over }) as FeedPost;

  const emptyFeed: FeedResponse = { posts: [], has_next: false, total_count: 0 };

  beforeEach(() => {
    feedServiceSpy = jasmine.createSpyObj('FeedService', [
      'getFeed',
      'getFriendlyErrorMessage',
      'getUserFeedStats',
      'toggleLikePost',
      'deletePost',
      'updatePost',
      'votePoll',
      'searchPosts',
      'createPost',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUserId', 'isUser']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUserById']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authServiceSpy.getCurrentUserId.and.returnValue('u1');
    authServiceSpy.isUser.and.returnValue(true);
    feedServiceSpy.getFeed.and.returnValue(of(emptyFeed));
    feedServiceSpy.getUserFeedStats.and.returnValue(of({} as any));
    userServiceSpy.getUserById.and.returnValue(of({ first_name: 'A', last_name: 'B' } as UserProfile));
    feedServiceSpy.getFriendlyErrorMessage.and.callFake((_e: any, fallback: string) => fallback);

    TestBed.configureTestingModule({
      declarations: [FeedPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: FeedService, useValue: feedServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
    component = TestBed.createComponent(FeedPageComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('resolves the current user, loads the profile, feed, and stats', () => {
      component.ngOnInit();
      expect(component.currentUserId).toBe('u1');
      expect(userServiceSpy.getUserById).toHaveBeenCalledWith('u1');
      expect(feedServiceSpy.getFeed).toHaveBeenCalled();
      expect(feedServiceSpy.getUserFeedStats).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('completes destroy$', () => {
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadFeed', () => {
    it('populates posts on success', () => {
      const resp: FeedResponse = { posts: [makePost()], has_next: true, next_cursor: 'c1', total_count: 1 };
      feedServiceSpy.getFeed.and.returnValue(of(resp));
      component.loadFeed();
      expect(component.posts.length).toBe(1);
      expect(component.hasMore).toBeTrue();
      expect(component.nextCursor).toBe('c1');
      expect(component.isLoading).toBeFalse();
    });

    it('adds a time_range filter when trending', () => {
      component.selectedFilter = 'trending';
      component.trendingTimeRange = '7d';
      component.loadFeed();
      expect(feedServiceSpy.getFeed).toHaveBeenCalledWith(
        jasmine.objectContaining({ feed_type: 'trending', time_range: 'week' }),
      );
    });

    it('sets a friendly error message on failure', () => {
      feedServiceSpy.getFeed.and.returnValue(throwError(() => new Error('boom')));
      component.loadFeed();
      expect(component.error).toBe('No se pudo cargar el feed. Intenta de nuevo.');
    });
  });

  describe('loadMorePosts', () => {
    it('does nothing without hasMore/cursor', () => {
      component.hasMore = false;
      component.loadMorePosts();
      expect(feedServiceSpy.getFeed).not.toHaveBeenCalled();
    });

    it('appends posts and updates the cursor', () => {
      component.posts = [makePost({ id: 'old' })];
      component.hasMore = true;
      component.nextCursor = 'c1';
      const resp: FeedResponse = {
        posts: [makePost({ id: 'new' })],
        has_next: false,
        next_cursor: undefined,
        total_count: 2,
      };
      feedServiceSpy.getFeed.and.returnValue(of(resp));
      component.loadMorePosts();
      expect(component.posts.map((p) => p.id)).toEqual(['old', 'new']);
      expect(component.hasMore).toBeFalse();
      expect(component.isLoadingMore).toBeFalse();
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      component.hasMore = true;
      component.nextCursor = 'c1';
      feedServiceSpy.getFeed.and.returnValue(throwError(() => new Error('boom')));
      component.loadMorePosts();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadUserStats', () => {
    it('sets userStats on success', () => {
      feedServiceSpy.getUserFeedStats.and.returnValue(of({ total_posts: 5 } as any));
      component.loadUserStats();
      expect(component.userStats).toEqual({ total_posts: 5 } as any);
    });

    it('logs on failure', () => {
      spyOn(console, 'error');
      feedServiceSpy.getUserFeedStats.and.returnValue(throwError(() => new Error('boom')));
      component.loadUserStats();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onFilterChange / setTrendingTimeRange', () => {
    it('reloads the feed on a real filter change', () => {
      spyOn(component, 'loadFeed');
      component.selectedFilter = 'personalized';
      component.onFilterChange('trending');
      expect(component.selectedFilter).toBe('trending');
      expect(component.loadFeed).toHaveBeenCalled();
    });

    it('does nothing when the filter is unchanged', () => {
      spyOn(component, 'loadFeed');
      component.selectedFilter = 'trending';
      component.onFilterChange('trending');
      expect(component.loadFeed).not.toHaveBeenCalled();
    });

    it('reloads only when in trending mode', () => {
      spyOn(component, 'loadFeed');
      component.selectedFilter = 'trending';
      component.trendingTimeRange = '24h';
      component.setTrendingTimeRange('30d');
      expect(component.loadFeed).toHaveBeenCalled();
    });

    it('does not reload outside trending mode', () => {
      spyOn(component, 'loadFeed');
      component.selectedFilter = 'personalized';
      component.trendingTimeRange = '24h';
      component.setTrendingTimeRange('30d');
      expect(component.loadFeed).not.toHaveBeenCalled();
    });
  });

  describe('onToggleLike', () => {
    it('updates the matching post', () => {
      component.posts = [makePost({ id: 'p1' })];
      feedServiceSpy.toggleLikePost.and.returnValue(of({ liked: true, likes_count: 4 }));
      component.onToggleLike(makePost({ id: 'p1' }));
      expect(component.posts[0].is_liked).toBeTrue();
      expect(component.posts[0].likes_count).toBe(4);
    });

    it('sets a friendly error on failure', () => {
      feedServiceSpy.toggleLikePost.and.returnValue(throwError(() => new Error('boom')));
      component.onToggleLike(makePost());
      expect(component.error).toBe('No se pudo procesar el like. Intenta de nuevo.');
    });
  });

  describe('onDeletePost', () => {
    it('does nothing without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.onDeletePost('p1');
      expect(feedServiceSpy.deletePost).not.toHaveBeenCalled();
    });

    it('removes the post and reloads stats', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component, 'loadUserStats');
      feedServiceSpy.deletePost.and.returnValue(of(undefined));
      component.posts = [makePost({ id: 'p1' })];
      component.onDeletePost('p1');
      expect(component.posts).toEqual([]);
      expect(component.loadUserStats).toHaveBeenCalled();
    });

    it('sets a friendly error message on failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      feedServiceSpy.deletePost.and.returnValue(throwError(() => new Error('boom')));
      component.onDeletePost('p1');
      expect(component.error).toBe('Could not delete the post. Please try again.');
    });
  });

  describe('onEditPost', () => {
    it('updates the matching post on success', () => {
      const updated = makePost({ id: 'p1', content: 'new' });
      feedServiceSpy.updatePost.and.returnValue(of(updated));
      component.posts = [makePost({ id: 'p1' })];
      component.onEditPost({ postId: 'p1', content: 'new', tags: [] });
      expect(component.posts[0]).toBe(updated);
    });

    it('sets a friendly error message on failure', () => {
      feedServiceSpy.updatePost.and.returnValue(throwError(() => new Error('boom')));
      component.onEditPost({ postId: 'p1', content: 'new', tags: [] });
      expect(component.error).toBe('Could not edit the post. Please try again.');
    });
  });

  describe('onVotePoll', () => {
    it('updates the matching post poll from response.poll', () => {
      const poll = { id: 'poll1', total_votes: 5 };
      component.posts = [makePost({ id: 'p1', poll: { id: 'poll1' } as any })];
      feedServiceSpy.votePoll.and.returnValue(of({ poll }));
      component.onVotePoll({ pollId: 'poll1', optionId: 'o1', isMultipleChoice: false });
      expect(feedServiceSpy.votePoll).toHaveBeenCalledWith('poll1', ['o1']);
      expect(component.posts[0].poll).toBe(poll as any);
    });

    it('falls back to the raw response when there is no .poll field', () => {
      component.posts = [makePost({ id: 'p1', poll: { id: 'poll1' } as any })];
      const response = { id: 'poll1', total_votes: 9 };
      feedServiceSpy.votePoll.and.returnValue(of(response));
      component.onVotePoll({ pollId: 'poll1', optionId: 'o1', isMultipleChoice: false });
      expect(component.posts[0].poll).toBe(response as any);
    });

    it('sets a specific error message from the response', () => {
      feedServiceSpy.votePoll.and.returnValue(throwError(() => ({ error: { error: 'nope' } })));
      component.onVotePoll({ pollId: 'poll1', optionId: 'o1', isMultipleChoice: false });
      expect(component.error).toBe('nope');
    });

    it('falls back to a default error message', () => {
      feedServiceSpy.votePoll.and.returnValue(throwError(() => ({})));
      component.onVotePoll({ pollId: 'poll1', optionId: 'o1', isMultipleChoice: false });
      expect(component.error).toBe('No se pudo registrar el voto. Intenta de nuevo.');
    });
  });

  describe('onSearch', () => {
    it('clears search when the query and tags are both empty', () => {
      spyOn(component, 'clearSearch');
      component.searchQuery = '   ';
      component.selectedTags = [];
      component.onSearch();
      expect(component.clearSearch).toHaveBeenCalled();
      expect(feedServiceSpy.searchPosts).not.toHaveBeenCalled();
    });

    it('searches and replaces posts on success', () => {
      component.searchQuery = 'ai';
      feedServiceSpy.searchPosts.and.returnValue(of([makePost({ id: 'r1' })]));
      component.onSearch();
      expect(component.posts.map((p) => p.id)).toEqual(['r1']);
      expect(component.hasMore).toBeFalse();
      expect(component.isSearching).toBeFalse();
      expect(component.isSearchMode).toBeTrue();
    });

    it('sets an error message on failure', () => {
      component.searchQuery = 'ai';
      feedServiceSpy.searchPosts.and.returnValue(throwError(() => new Error('boom')));
      component.onSearch();
      expect(component.error).toBe('Could not perform the search. Please try again.');
    });
  });

  describe('clearSearch', () => {
    it('resets search state and reloads the feed', () => {
      spyOn(component, 'loadFeed');
      component.searchQuery = 'x';
      component.tagInput = 'y';
      component.selectedTags = ['a'];
      component.isSearchMode = true;
      component.clearSearch();
      expect(component.searchQuery).toBe('');
      expect(component.selectedTags).toEqual([]);
      expect(component.isSearchMode).toBeFalse();
      expect(component.loadFeed).toHaveBeenCalled();
    });
  });

  describe('addSearchTag / removeSearchTag', () => {
    it('adds a tag without a leading # and triggers a search', () => {
      spyOn(component, 'onSearch');
      component.tagInput = '#ai';
      component.addSearchTag();
      expect(component.selectedTags).toEqual(['ai']);
      expect(component.tagInput).toBe('');
      expect(component.onSearch).toHaveBeenCalled();
    });

    it('prevents default when an event is given', () => {
      spyOn(component, 'onSearch');
      const event = { preventDefault: jasmine.createSpy() } as unknown as Event;
      component.tagInput = 'x';
      component.addSearchTag(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not add beyond 5 tags or a duplicate', () => {
      spyOn(component, 'onSearch');
      component.selectedTags = ['a', 'b', 'c', 'd', 'e'];
      component.tagInput = 'f';
      component.addSearchTag();
      expect(component.selectedTags.length).toBe(5);

      component.selectedTags = ['a'];
      component.tagInput = 'a';
      component.addSearchTag();
      expect(component.selectedTags).toEqual(['a']);
    });

    it('removeSearchTag removes by index and re-searches', () => {
      spyOn(component, 'onSearch');
      component.selectedTags = ['a', 'b'];
      component.removeSearchTag(0);
      expect(component.selectedTags).toEqual(['b']);
      expect(component.onSearch).toHaveBeenCalled();
    });
  });

  it('refreshFeed reloads the feed and stats', () => {
    spyOn(component, 'loadFeed');
    spyOn(component, 'loadUserStats');
    component.refreshFeed();
    expect(component.loadFeed).toHaveBeenCalled();
    expect(component.loadUserStats).toHaveBeenCalled();
  });

  describe('onScroll', () => {
    it('loads more posts near the bottom of the page', () => {
      spyOn(component, 'loadMorePosts');
      spyOnProperty(window, 'pageYOffset').and.returnValue(1000);
      spyOnProperty(window, 'innerHeight').and.returnValue(800);
      spyOnProperty(document.documentElement, 'scrollHeight').and.returnValue(1850);
      component.onScroll();
      expect(component.loadMorePosts).toHaveBeenCalled();
    });

    it('does nothing far from the bottom', () => {
      spyOn(component, 'loadMorePosts');
      spyOnProperty(window, 'pageYOffset').and.returnValue(0);
      spyOnProperty(window, 'innerHeight').and.returnValue(800);
      spyOnProperty(document.documentElement, 'scrollHeight').and.returnValue(5000);
      component.onScroll();
      expect(component.loadMorePosts).not.toHaveBeenCalled();
    });
  });

  describe('onPostSubmitted', () => {
    it('prepends the new post and reloads stats on success', () => {
      spyOn(component, 'loadUserStats');
      const newPost = makePost({ id: 'new1' });
      feedServiceSpy.createPost.and.returnValue(of(newPost));
      component.posts = [makePost({ id: 'old' })];
      component.onPostSubmitted({ content: 'x', tags: [], files: [] } as any);
      expect(component.posts[0]).toBe(newPost);
      expect(component.isSubmittingPost).toBeFalse();
      expect(component.loadUserStats).toHaveBeenCalled();
    });

    it('includes poll_data when a poll is present', () => {
      feedServiceSpy.createPost.and.returnValue(of(makePost()));
      component.onPostSubmitted({
        content: 'x',
        tags: [],
        poll: { question: 'q', options: ['a', 'b'] },
      } as any);
      const arg = feedServiceSpy.createPost.calls.mostRecent().args[0];
      expect(arg.poll_data).toEqual({ question: 'q', options: ['a', 'b'] });
    });

    it('sets a friendly error message on failure', () => {
      feedServiceSpy.createPost.and.returnValue(throwError(() => new Error('boom')));
      component.onPostSubmitted({ content: 'x', tags: [] } as any);
      expect(component.error).toBe(
        'Could not create the post. Please check the description and attached files.',
      );
    });
  });

  describe('loadCurrentUserProfile (via ngOnInit)', () => {
    it('sets avatar/name from the loaded profile', () => {
      userServiceSpy.getUserById.and.returnValue(
        of({ first_name: 'Ana', last_name: 'Perez', profile_picture: 'pic.png' } as UserProfile),
      );
      component.ngOnInit();
      expect(component.currentUserAvatar).toBe('pic.png');
      expect(component.currentUserName).toBe('Ana Perez');
    });

    it('skips loading when there is no currentUserId', () => {
      authServiceSpy.getCurrentUserId.and.returnValue(null);
      component.ngOnInit();
      expect(userServiceSpy.getUserById).not.toHaveBeenCalled();
    });

    it('skips loading for a non-user (e.g. a company) account', () => {
      authServiceSpy.isUser.and.returnValue(false);
      component.ngOnInit();
      expect(userServiceSpy.getUserById).not.toHaveBeenCalled();
    });

    it('logs on a profile-load failure', () => {
      spyOn(console, 'error');
      userServiceSpy.getUserById.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('removeTag removes by index and reloads the feed', () => {
    spyOn(component, 'loadFeed');
    component.selectedTags = ['a', 'b'];
    component.removeTag(0);
    expect(component.selectedTags).toEqual(['b']);
    expect(component.loadFeed).toHaveBeenCalled();
  });

  it('trackByPostId returns the post id', () => {
    expect(component.trackByPostId(0, makePost({ id: 'p9' }))).toBe('p9');
  });

  it('onSharePost logs the post', () => {
    spyOn(console, 'log');
    component.onSharePost(makePost());
    expect(console.log).toHaveBeenCalled();
  });

  it('onViewProfile navigates to the profile route', () => {
    component.onViewProfile('u9');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/profile', 'u9', 'about-me']);
  });
});
